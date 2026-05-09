using Microsoft.Extensions.Caching.Memory;
using Microsoft.EntityFrameworkCore;
using Diplom.Models;
using Diplom.Controllers;

namespace Diplom.Services
{
    public class FilterCacheService
    {
        private readonly IMemoryCache _cache;
        private readonly ToolShopDbContext _context;
        private readonly ILogger<FilterCacheService> _logger;
        private readonly HierarchicalFilterService _hierarchicalService;
        
        private const string CACHE_KEY_FILTERS = "product_filters";
        private const string CACHE_KEY_CATEGORIES = "categories_with_counts";
        private const int CACHE_MINUTES = 5;

        public FilterCacheService(
            IMemoryCache cache, 
            ToolShopDbContext context,
            ILogger<FilterCacheService> logger,
            HierarchicalFilterService hierarchicalService)
        {
            _cache = cache;
            _context = context;
            _logger = logger;
            _hierarchicalService = hierarchicalService;
        }

        /// <summary>
        /// Получить фильтры с кэшированием
        /// </summary>
        public async Task<ProductFiltersDto> GetFiltersAsync()
        {
            return await _cache.GetOrCreateAsync(CACHE_KEY_FILTERS, async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(CACHE_MINUTES);
                entry.SetPriority(CacheItemPriority.High);
                
                _logger.LogInformation("[CACHE] Loading filters from database");
                var filters = await LoadFiltersFromDatabase();
                _logger.LogInformation("[CACHE] Filters loaded and cached for {Minutes} minutes", CACHE_MINUTES);
                
                return filters;
            });
        }

        /// <summary>
        /// Получить категории с количеством товаров (с кэшированием)
        /// </summary>
        public async Task<List<CategoryFilterDto>> GetCategoriesAsync()
        {
            return await _cache.GetOrCreateAsync(CACHE_KEY_CATEGORIES, async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(CACHE_MINUTES);
                entry.SetPriority(CacheItemPriority.High);
                
                _logger.LogInformation("[CACHE] Loading categories from database");
                var categories = await _context.Categories
                    .Select(c => new CategoryFilterDto
                    {
                        Id = c.Id,
                        Name = c.Name,
                        ProductCount = c.Products.Count(p => p.IsActive == true)
                    })
                    .Where(c => c.ProductCount > 0)
                    .ToListAsync();
                
                _logger.LogInformation("[CACHE] Categories loaded: {Count}", categories.Count);
                return categories;
            });
        }

        /// <summary>
        /// Инвалидировать кэш фильтров (вызывать после импорта товаров)
        /// </summary>
        public void InvalidateFiltersCache()
        {
            _cache.Remove(CACHE_KEY_FILTERS);
            _cache.Remove(CACHE_KEY_CATEGORIES);
            _logger.LogInformation("[CACHE] Filters cache invalidated");
        }

        /// <summary>
        /// Принудительно очистить весь кэш (для отладки)
        /// </summary>
        public void ClearAllCache()
        {
            if (_cache is MemoryCache memoryCache)
            {
                memoryCache.Clear();
                _logger.LogInformation("[CACHE] All cache cleared");
            }
        }

        /// <summary>
        /// Загрузить фильтры из базы данных (используя материализованное представление если доступно)
        /// </summary>
        private async Task<ProductFiltersDto> LoadFiltersFromDatabase()
        {
            var startTime = DateTime.UtcNow;

            // Категории
            var categories = await GetCategoriesAsync();

            // Цены
            var prices = await _context.Products
                .Where(p => p.IsActive == true)
                .Select(p => p.Price)
                .ToListAsync();

            // Атрибуты - пробуем использовать материализованное представление
            List<AttributeFilterDto> attributes;
            
            try
            {
                // Пытаемся использовать материализованное представление
                var attributeData = await _context.Database
                    .SqlQueryRaw<MaterializedFilterCount>(@"
                        SELECT attr_name as ""AttrName"", attr_value as ""AttrValue"", product_count as ""ProductCount""
                        FROM mv_filter_counts
                        ORDER BY attr_name, product_count DESC
                    ")
                    .ToListAsync();

                attributes = attributeData
                    .GroupBy(a => a.AttrName)
                    .Select(g => new AttributeFilterDto
                    {
                        Name = g.Key,
                        Values = g.Select(v => new AttributeValueDto
                        {
                            Value = v.AttrValue,
                            Count = v.ProductCount
                        }).ToList()
                    })
                    .ToList();

                _logger.LogInformation("[CACHE] Used materialized view for filters");
            }
            catch (Exception ex)
            {
                // Fallback: если материализованное представление не существует
                _logger.LogWarning(ex, "[CACHE] Materialized view not available, using direct query");
                
                var attributeData = await _context.ProductAttributes
                    .Where(pa => pa.Product.IsActive == true)
                    .Select(pa => new { pa.AttrName, pa.AttrValue, pa.ProductId })
                    .ToListAsync();

                attributes = attributeData
                    .GroupBy(pa => pa.AttrName)
                    .Select(g => new AttributeFilterDto
                    {
                        Name = g.Key,
                        Values = g.GroupBy(pa => pa.AttrValue)
                                  .Select(vg => new AttributeValueDto
                                  {
                                      Value = vg.Key,
                                      Count = vg.Select(pa => pa.ProductId).Distinct().Count()
                                  })
                                  .OrderByDescending(v => v.Count)
                                  .ToList()
                    })
                    .ToList();
            }

            // Применяем умную группировку для брендов с подгруппами
            var brandFilterIndex = attributes.FindIndex(a => a.Name == "Бренд");
            if (brandFilterIndex >= 0)
            {
                _logger.LogInformation("[CACHE] Applying hierarchical grouping for brands");
                var hierarchicalBrandFilter = await ApplyHierarchicalBrandGrouping(attributes[brandFilterIndex]);
                attributes[brandFilterIndex] = hierarchicalBrandFilter;
                
                // Log результат
                var brandsWithSubgroups = hierarchicalBrandFilter.Values.Count(v => v.Subgroups != null && v.Subgroups.Any());
                _logger.LogInformation($"[CACHE] Hierarchical grouping applied: {brandsWithSubgroups} brands with subgroups out of {hierarchicalBrandFilter.Values.Count} total brands");
            }

            var duration = (DateTime.UtcNow - startTime).TotalMilliseconds;
            _logger.LogInformation("[CACHE] Filters loaded in {Duration}ms", duration);

            return new ProductFiltersDto
            {
                Categories = categories,
                MinPrice = prices.Any() ? prices.Min() : 0,
                MaxPrice = prices.Any() ? prices.Max() : 0,
                Attributes = attributes
            };
        }

        /// <summary>
        /// Применить иерархическую группировку для брендов с подгруппами
        /// </summary>
        private async Task<AttributeFilterDto> ApplyHierarchicalBrandGrouping(AttributeFilterDto brandFilter)
        {
            try
            {
                _logger.LogInformation($"[CACHE] Starting hierarchical grouping for {brandFilter.Values.Count} brands");
                
                // Получаем иерархические бренды с подгруппами
                var hierarchicalBrands = await _hierarchicalService.GetAllBrandsWithSubgroups(
                    minProductsForBrand: 3,      // Минимум 3 товара для отображения бренда
                    minProductsForSubgroup: 5    // Минимум 5 товаров для создания подгруппы
                );

                _logger.LogInformation($"[CACHE] Got {hierarchicalBrands.Count} hierarchical brands from service");

                // Конвертируем в формат AttributeFilterDto
                var result = _hierarchicalService.ConvertToAttributeFilter(hierarchicalBrands);
                
                var brandsWithSubgroups = result.Values.Count(v => v.Subgroups != null && v.Subgroups.Any());
                _logger.LogInformation($"[CACHE] Hierarchical brands: {result.Values.Count}, " +
                    $"with subgroups: {brandsWithSubgroups}");
                
                // Log first brand with subgroups for debugging
                var firstBrandWithSubgroups = result.Values.FirstOrDefault(v => v.Subgroups != null && v.Subgroups.Any());
                if (firstBrandWithSubgroups != null)
                {
                    _logger.LogInformation($"[CACHE] Example: {firstBrandWithSubgroups.Value} has {firstBrandWithSubgroups.Subgroups.Count} subgroups");
                }
                
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[CACHE] Failed to apply hierarchical grouping, using simple grouping");
                // Fallback на простую группировку
                brandFilter.Values = GroupBrandValues(brandFilter.Values);
                return brandFilter;
            }
        }

        /// <summary>
        /// Группировка брендов: популярные первыми, остальные в конце (простая версия)
        /// </summary>
        private List<AttributeValueDto> GroupBrandValues(List<AttributeValueDto> values)
        {
            const int TOP_BRANDS_COUNT = 10;
            
            // Топ-10 брендов по количеству товаров
            var topBrands = values
                .OrderByDescending(v => v.Count)
                .Take(TOP_BRANDS_COUNT)
                .ToList();
            
            // Остальные бренды в алфавитном порядке
            var otherBrands = values
                .Except(topBrands)
                .OrderBy(v => v.Value)
                .ToList();
            
            // Объединяем: сначала популярные, потом остальные
            var result = new List<AttributeValueDto>();
            result.AddRange(topBrands);
            result.AddRange(otherBrands);
            
            return result;
        }
    }

    /// <summary>
    /// DTO для чтения из материализованного представления
    /// </summary>
    public class MaterializedFilterCount
    {
        public string AttrName { get; set; } = string.Empty;
        public string AttrValue { get; set; } = string.Empty;
        public int ProductCount { get; set; }
    }
}
