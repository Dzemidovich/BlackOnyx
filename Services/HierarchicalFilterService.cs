using Microsoft.EntityFrameworkCore;
using Diplom.Models;
using Diplom.Controllers;
using static Diplom.Controllers.ProductsController;

namespace Diplom.Services
{
    /// <summary>
    /// Сервис для создания иерархических фильтров с подгруппами
    /// </summary>
    public class HierarchicalFilterService
    {
        private readonly ToolShopDbContext _context;
        private readonly ILogger<HierarchicalFilterService> _logger;

        // Ключевые слова для группировки товаров внутри брендов
        private readonly Dictionary<string, List<string>> _categoryKeywords = new()
        {
            ["Дрели и шуруповерты"] = new() { "дрель", "шуруповерт", "шуруповёрт", "дрель-шуруповерт", "дрель-шуруповёрт" },
            ["Болгарки (УШМ)"] = new() { "болгарка", "ушм", "углошлифовальная", "угловая шлифмашина" },
            ["Перфораторы"] = new() { "перфоратор", "роторный перфоратор" },
            ["Пилы"] = new() { "пила", "лобзик", "циркулярная", "сабельная", "торцовочная", "электролобзик", "дисковая пила", "погружная пила" },
            ["Шлифмашины"] = new() { "шлифмашина", "шлифовальная", "эксцентриковая", "ленточная", "многофункциональная шлифмашина" },
            ["Фрезеры"] = new() { "фрезер", "кромочный" },
            ["Рубанки"] = new() { "рубанок", "электрорубанок" },
            ["Гайковерты"] = new() { "гайковерт", "ударный" },
            ["Измерительные"] = new() { "уровень", "дальномер", "нивелир", "детектор", "лазерный дальномер", "лазерный уровень", "мультиметр" },
            ["Пылесосы"] = new() { "пылесос", "строительный пылесос" },
            ["Компрессоры"] = new() { "компрессор" },
            ["Генераторы"] = new() { "генератор", "электростанция" },
            ["Сварочное оборудование"] = new() { "сварочный", "сварка", "инвертор" },
            ["Садовая техника"] = new() { "газонокосилка", "триммер", "кусторез", "цепная пила" }
        };

        public HierarchicalFilterService(ToolShopDbContext context, ILogger<HierarchicalFilterService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Получить иерархические фильтры для бренда с подгруппами
        /// </summary>
        public async Task<HierarchicalBrandFilterDto> GetBrandWithSubgroups(string brandName, int minProductsForSubgroup = 5)
        {
            // Получаем все товары бренда
            var brandProducts = await _context.ProductAttributes
                .Where(pa => pa.AttrName == "Бренд" && pa.AttrValue == brandName)
                .Join(_context.Products,
                    pa => pa.ProductId,
                    p => p.Id,
                    (pa, p) => new { p.Id, p.Name, p.IsActive })
                .Where(x => x.IsActive == true)
                .ToListAsync();

            var totalCount = brandProducts.Count;
            _logger.LogInformation($"[HIERARCHICAL] Brand '{brandName}': {totalCount} products");

            // Группируем товары по ключевым словам
            var subgroups = new List<BrandSubgroupDto>();
            var assignedProductIds = new HashSet<int>();

            // Сначала проходим по всем категориям и считаем товары
            var categoryMatches = new Dictionary<string, List<dynamic>>();
            
            foreach (var (categoryName, keywords) in _categoryKeywords)
            {
                var matchingProducts = brandProducts
                    .Where(p => keywords.Any(kw => p.Name.ToLower().Contains(kw.ToLower())))
                    .Cast<dynamic>()
                    .ToList();

                if (matchingProducts.Count > 0)
                {
                    categoryMatches[categoryName] = matchingProducts;
                    _logger.LogInformation($"[HIERARCHICAL]   Found {matchingProducts.Count} products for '{categoryName}'");
                }
            }

            // Теперь создаем подгруппы только для категорий с 5+ товарами
            foreach (var (categoryName, matchingProducts) in categoryMatches)
            {
                if (matchingProducts.Count >= minProductsForSubgroup)
                {
                    // Исключаем уже назначенные товары
                    var availableProducts = matchingProducts
                        .Where(p => !assignedProductIds.Contains(p.Id))
                        .ToList();

                    if (availableProducts.Count >= minProductsForSubgroup)
                    {
                        subgroups.Add(new BrandSubgroupDto
                        {
                            Name = categoryName,
                            Count = availableProducts.Count,
                            Keywords = _categoryKeywords[categoryName]
                        });

                        // Помечаем товары как назначенные
                        foreach (var product in availableProducts)
                        {
                            assignedProductIds.Add(product.Id);
                        }

                        _logger.LogInformation($"[HIERARCHICAL]   ✓ Subgroup '{categoryName}': {availableProducts.Count} products");
                        
                        // Логируем первые несколько товаров для отладки
                        var sampleProducts = availableProducts.Take(3).Select(p => p.Name);
                        _logger.LogInformation($"[HIERARCHICAL]     Sample: {string.Join(", ", sampleProducts)}");
                    }
                }
                else
                {
                    _logger.LogInformation($"[HIERARCHICAL]   ✗ Skipped '{categoryName}': only {matchingProducts.Count} products (need {minProductsForSubgroup}+)");
                }
            }

            // Все остальные товары (включая те, что не попали в подгруппы) идут в "Остальное"
            var otherCount = totalCount - assignedProductIds.Count;
            if (otherCount > 0)
            {
                subgroups.Add(new BrandSubgroupDto
                {
                    Name = "Остальное",
                    Count = otherCount,
                    Keywords = new List<string>()
                });
                
                _logger.LogInformation($"[HIERARCHICAL]   ✓ 'Остальное': {otherCount} products");
            }

            return new HierarchicalBrandFilterDto
            {
                BrandName = brandName,
                TotalCount = totalCount,
                Subgroups = subgroups.OrderByDescending(s => s.Count).ToList()
            };
        }

        /// <summary>
        /// Получить все бренды с подгруппами
        /// </summary>
        public async Task<List<HierarchicalBrandFilterDto>> GetAllBrandsWithSubgroups(
            int minProductsForBrand = 3,
            int minProductsForSubgroup = 5)
        {
            // Получаем все бренды
            var brands = await _context.ProductAttributes
                .Where(pa => pa.AttrName == "Бренд" && pa.Product.IsActive == true)
                .GroupBy(pa => pa.AttrValue)
                .Select(g => new
                {
                    BrandName = g.Key,
                    Count = g.Select(pa => pa.ProductId).Distinct().Count()
                })
                .Where(b => b.Count >= minProductsForBrand)
                .OrderByDescending(b => b.Count)
                .ToListAsync();

            _logger.LogInformation($"[HIERARCHICAL] Processing {brands.Count} brands (min {minProductsForBrand} products each)");

            var result = new List<HierarchicalBrandFilterDto>();

            foreach (var brand in brands)
            {
                var hierarchicalBrand = await GetBrandWithSubgroups(brand.BrandName, minProductsForSubgroup);
                result.Add(hierarchicalBrand);
            }

            return result;
        }

        /// <summary>
        /// Конвертировать иерархические фильтры в формат для API
        /// </summary>
        public AttributeFilterDto ConvertToAttributeFilter(List<HierarchicalBrandFilterDto> hierarchicalBrands)
        {
            var values = new List<AttributeValueDto>();

            foreach (var brand in hierarchicalBrands)
            {
                // Добавляем сам бренд
                values.Add(new AttributeValueDto
                {
                    Value = brand.BrandName,
                    Count = brand.TotalCount,
                    Subgroups = brand.Subgroups.Select(sg => new AttributeSubgroupDto
                    {
                        Name = sg.Name,
                        Count = sg.Count,
                        Keywords = sg.Keywords
                    }).ToList()
                });
            }

            return new AttributeFilterDto
            {
                Name = "Бренд",
                Values = values
            };
        }
    }

    /// <summary>
    /// DTO для иерархического бренда с подгруппами
    /// </summary>
    public class HierarchicalBrandFilterDto
    {
        public string BrandName { get; set; } = string.Empty;
        public int TotalCount { get; set; }
        public List<BrandSubgroupDto> Subgroups { get; set; } = new();
    }

    /// <summary>
    /// DTO для подгруппы внутри бренда
    /// </summary>
    public class BrandSubgroupDto
    {
        public string Name { get; set; } = string.Empty;
        public int Count { get; set; }
        public List<string> Keywords { get; set; } = new();
    }

}
