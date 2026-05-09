using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Diplom.Models;
using Diplom.DTOs;
using Diplom.Services;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace Diplom.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public partial class ProductsController : ControllerBase
    {
        private readonly ToolShopDbContext _context;

        public ProductsController(ToolShopDbContext context)
        {
            _context = context;
        }

        private string? GetImageUrlForProduct(Product product)
        {
            // Используем ImageUrl из базы данных
            if (!string.IsNullOrEmpty(product.ImageUrl))
            {
                Console.WriteLine($"[IMAGE] Article: {product.Article} -> From DB: {product.ImageUrl}");
                return product.ImageUrl;
            }

            Console.WriteLine($"[IMAGE] Article: {product.Article} -> NOT FOUND in DB");
            return null;
        }

        [HttpGet("{id}/details")]
        public async Task<ActionResult<ProductDetailDto>> GetProductDetails(int id)
        {
            // Fetch product with attributes and category
            var product = await _context.Products
                .Include(p => p.ProductAttributes)
                .Include(p => p.Category)
                .FirstOrDefaultAsync(p => p.Id == id && p.IsActive == true);

            if (product == null)
            {
                return NotFound();
            }

            Console.WriteLine($"[RELATED] Product ID: {id}, CategoryId: {product.CategoryId}");

            // Fetch related products from same category (exclude current product)
            var relatedProductsData = new List<Product>();
            
            // 1. Пытаемся найти товары в той же категории
            if (product.CategoryId.HasValue)
            {
                relatedProductsData = await _context.Products
                    .Where(p => p.CategoryId == product.CategoryId
                             && p.Id != id
                             && p.IsActive == true
                             && p.Stock > 0)
                    .OrderBy(p => EF.Functions.Random()) // Надежный рандом для PostgreSQL
                    .Take(5)
                    .ToListAsync();
                
                Console.WriteLine($"[RELATED] Found {relatedProductsData.Count} products in same category");
            }
            
            // 2. Если в категории мало товаров или категории нет — добираем из общего списка
            if (relatedProductsData.Count < 5)
            {
                var excludeIds = relatedProductsData.Select(x => x.Id).Append(id).ToList();
                var additionalProducts = await _context.Products
                    .Where(p => !excludeIds.Contains(p.Id)
                             && p.IsActive == true
                             && p.Stock > 0)
                    .OrderBy(p => EF.Functions.Random())
                    .Take(5 - relatedProductsData.Count)
                    .ToListAsync();
                
                Console.WriteLine($"[RELATED] Added {additionalProducts.Count} additional products");
                relatedProductsData.AddRange(additionalProducts);
            }
            
            var relatedProducts = relatedProductsData.Select(p => new RelatedProductDto
            {
                Id = p.Id,
                Article = p.Article,
                Name = p.Name,
                Price = p.Price,
                ImageUrl = GetImageUrlForProduct(p),
                Stock = p.Stock
            }).ToList();

            Console.WriteLine($"[RELATED] Total related products: {relatedProducts.Count}");

            // Build category breadcrumb
            var breadcrumb = await BuildCategoryBreadcrumb(product.CategoryId);

            return new ProductDetailDto
            {
                Product = await MapToProductDto(product),
                RelatedProducts = relatedProducts,
                Breadcrumb = breadcrumb
            };
        }

        private async Task<List<BreadcrumbItem>> BuildCategoryBreadcrumb(int? categoryId)
        {
            var breadcrumb = new List<BreadcrumbItem>();
            var currentCategoryId = categoryId;

            while (currentCategoryId.HasValue)
            {
                var category = await _context.Categories
                    .FirstOrDefaultAsync(c => c.Id == currentCategoryId);

                if (category == null) break;

                breadcrumb.Insert(0, new BreadcrumbItem
                {
                    Id = category.Id,
                    Name = category.Name
                });

                currentCategoryId = category.ParentId;
            }

            return breadcrumb;
        }


        [HttpGet("by-ids")]
        public async Task<ActionResult<IEnumerable<ProductDto>>> GetProductsByIds([FromQuery] string ids)
        {
            if (string.IsNullOrEmpty(ids))
            {
                return Ok(new List<ProductDto>());
            }

            var idList = ids.Split(',')
                .Select(id => int.TryParse(id.Trim(), out var parsed) ? parsed : (int?)null)
                .Where(id => id.HasValue)
                .Select(id => id!.Value)
                .ToList();

            if (!idList.Any())
            {
                return Ok(new List<ProductDto>());
            }

            var products = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.ProductAttributes)
                .Where(p => idList.Contains(p.Id) && p.IsActive == true)
                .ToListAsync();

            var productDtos = new List<ProductDto>();
            foreach (var p in products)
            {
                productDtos.Add(await MapToProductDto(p));
            }

            // Return products in the same order as requested IDs
            var orderedProducts = idList
                .Select(id => productDtos.FirstOrDefault(p => p.Id == id))
                .Where(p => p != null)
                .ToList();

            return Ok(orderedProducts);
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProductDto>>> GetProducts(
            string? search = null,
            int? categoryId = null,
            decimal? minPrice = null,
            decimal? maxPrice = null,
            bool? inStock = null,
            string? attributes = null,
            string? sortBy = "name",
            string? sortDirection = "asc",
            int? page = null,
            int? pageSize = null,
            bool? includeInactive = null)
        {
            // 1. BASE QUERY
            var query = _context.Products
                .Include(p => p.Category)
                .Include(p => p.ProductAttributes)
                .AsQueryable();

            // Filter by active status
            if (includeInactive != true)
            {
                query = query.Where(p => p.IsActive == true);
            }

            // 2. APPLY ALL FILTERS (Search, Category, Price, Stock, Attributes)
            if (!string.IsNullOrEmpty(search))
            {
                var searchTerm = search.Trim();
                var pattern = $"%{searchTerm}%";
                Console.WriteLine($"[SEARCH] Term: {searchTerm}, Pattern: {pattern}");
                
                query = query.Where(p =>
                    EF.Functions.ILike(p.Name, pattern) ||
                    EF.Functions.ILike(p.Article, pattern) ||
                    (p.Description != null && EF.Functions.ILike(p.Description, pattern)));
            }

            if (categoryId.HasValue)
            {
                var categoryIds = await GetCategoryAndSubcategoryIds(categoryId.Value);
                query = query.Where(p => p.CategoryId != null && categoryIds.Contains(p.CategoryId.Value));
            }

            if (minPrice.HasValue)
            {
                query = query.Where(p => p.Price >= minPrice.Value);
            }
            if (maxPrice.HasValue)
            {
                query = query.Where(p => p.Price <= maxPrice.Value);
            }

            if (inStock == true)
            {
                query = query.Where(p => p.Stock > 0);
            }

            if (!string.IsNullOrEmpty(attributes))
            {
                var attributeFilters = attributes.Split(',')
                    .Select(attr => attr.Split(':'))
                    .Where(parts => parts.Length == 2)
                    .Select(parts => new { Name = parts[0].Trim(), Value = parts[1].Trim() })
                    .ToList();

                foreach (var attrFilter in attributeFilters)
                {
                    query = query.Where(p => p.ProductAttributes
                        .Any(attr => attr.AttrName == attrFilter.Name && attr.AttrValue == attrFilter.Value));
                }
            }

            // 3. COUNT TOTAL (after ALL filters, before pagination)
            int totalCount = await query.CountAsync();
            Console.WriteLine($"[QUERY] Total products after ALL filters: {totalCount}");

            // 4. APPLY SORTING
            query = sortBy?.ToLower() switch
            {
                "price" => sortDirection?.ToLower() == "desc"
                    ? query.OrderByDescending(p => p.Price)
                    : query.OrderBy(p => p.Price),
                "name" => sortDirection?.ToLower() == "desc"
                    ? query.OrderByDescending(p => p.Name)
                    : query.OrderBy(p => p.Name),
                "created" => sortDirection?.ToLower() == "desc"
                    ? query.OrderByDescending(p => p.CreatedAt)
                    : query.OrderBy(p => p.CreatedAt),
                _ => query.OrderBy(p => p.Name)
            };

            // 5. APPLY PAGINATION (last!)
            if (page.HasValue && pageSize.HasValue && page.Value > 0 && pageSize.Value > 0)
            {
                query = query.Skip((page.Value - 1) * pageSize.Value).Take(pageSize.Value);
            }

            var products = await query.ToListAsync();

            // Определяем роль пользователя для показа цен
            var userRole = User.FindFirst("role")?.Value ?? User.FindFirst(ClaimTypes.Role)?.Value;
            bool isAdmin = userRole == "Admin";

            var productDtos = new List<ProductDto>();
            foreach (var p in products)
            {
                productDtos.Add(new ProductDto
                {
                    Id = p.Id,
                    Article = p.Article,
                    Name = p.Name,
                    Description = p.Description,
                    Price = p.Price,
                    BasePrice = isAdmin ? p.Price : null,
                    CostPrice = isAdmin ? p.CostPrice : null,
                    Stock = p.Stock,
                    CategoryId = p.CategoryId,
                    CategoryName = p.Category?.Name,
                    ImageUrl = GetImageUrlForProduct(p), // Автоматическая подстановка изображения
                    IsActive = p.IsActive,
                    CreatedAt = p.CreatedAt,
                    AverageRating = 0,
                    ReviewCount = 0,
                    Attributes = p.ProductAttributes.Select(a => new ProductAttributeDto
                    {
                        AttrName = a.AttrName,
                        AttrValue = a.AttrValue
                    }).ToList()
                });
            }

            // Add pagination info to response headers if paginated
            if (page.HasValue && pageSize.HasValue)
            {
                Response.Headers["X-Total-Count"] = totalCount.ToString();
                Response.Headers["X-Page-Size"] = pageSize.ToString();
                Response.Headers["X-Current-Page"] = page.ToString();
                Response.Headers["X-Total-Pages"] = ((totalCount + pageSize.Value - 1) / pageSize.Value).ToString();
            }

            return Ok(productDtos);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ProductDto>> GetProduct(int id)
        {
            var product = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.ProductAttributes)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null)
            {
                return NotFound();
            }

            return await MapToProductDto(product);
        }


        [HttpPost("{id}/restock")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> RestockProduct(int id, [FromBody] RestockDto restockDto)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null)
            {
                return NotFound();
            }

            product.Stock += restockDto.Quantity;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Product restocked successfully", newStock = product.Stock });
        }

        [HttpGet("low-stock")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<object>> GetLowStockProducts(
            int threshold = 10,
            int page = 1,
            int pageSize = 35,
            string? search = null)
        {
            var query = _context.Products
                .Include(p => p.Category)
                .Include(p => p.ProductAttributes)
                .Where(p => p.Stock <= threshold && p.IsActive == true);

            // Apply search filter
            if (!string.IsNullOrEmpty(search))
            {
                var searchTerm = search.Trim().ToLower();
                query = query.Where(p =>
                    p.Name.ToLower().Contains(searchTerm) ||
                    p.Article.ToLower().Contains(searchTerm));
            }

            // Get total count before pagination
            var totalCount = await query.CountAsync();

            // Apply sorting and pagination
            var products = await query
                .OrderBy(p => p.Stock)
                .ThenBy(p => p.Name)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var productDtos = new List<ProductDto>();
            foreach (var p in products)
            {
                productDtos.Add(await MapToProductDto(p));
            }

            // Return paginated response
            return Ok(new
            {
                products = productDtos,
                pagination = new
                {
                    currentPage = page,
                    pageSize = pageSize,
                    totalCount = totalCount,
                    totalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
                    hasNextPage = page < Math.Ceiling(totalCount / (double)pageSize),
                    hasPreviousPage = page > 1
                }
            });
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<ProductDto>> CreateProduct([FromBody] CreateProductDto createDto)
        {
            var product = new Product
            {
                Article = createDto.Article,
                Name = createDto.Name,
                Description = createDto.Description,
                Price = createDto.Price,
                CostPrice = createDto.CostPrice,
                Stock = createDto.Stock,
                CategoryId = createDto.CategoryId,
                ImageUrl = createDto.ImageUrl,
                IsActive = createDto.IsActive ?? true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            if (createDto.Attributes != null && createDto.Attributes.Any())
            {
                foreach (var attr in createDto.Attributes)
                {
                    _context.ProductAttributes.Add(new ProductAttribute
                    {
                        ProductId = product.Id,
                        AttrName = attr.AttrName,
                        AttrValue = attr.AttrValue
                    });
                }
                await _context.SaveChangesAsync();
            }

            var createdProduct = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.ProductAttributes)
                .FirstOrDefaultAsync(p => p.Id == product.Id);

            return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, await MapToProductDto(createdProduct!));
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> UpdateProduct(int id, [FromBody] UpdateProductDto updateDto)
        {
            var product = await _context.Products
                .Include(p => p.ProductAttributes)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null)
            {
                return NotFound();
            }

            product.Article = updateDto.Article;
            product.Name = updateDto.Name;
            product.Description = updateDto.Description;
            product.Price = updateDto.Price;
            product.CostPrice = updateDto.CostPrice;
            product.Stock = updateDto.Stock;
            product.CategoryId = updateDto.CategoryId;
            product.ImageUrl = updateDto.ImageUrl;
            product.IsActive = updateDto.IsActive ?? true;

            if (updateDto.Attributes != null)
            {
                _context.ProductAttributes.RemoveRange(product.ProductAttributes);
                foreach (var attr in updateDto.Attributes)
                {
                    _context.ProductAttributes.Add(new ProductAttribute
                    {
                        ProductId = product.Id,
                        AttrName = attr.AttrName,
                        AttrValue = attr.AttrValue
                    });
                }
            }

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null)
            {
                return NotFound();
            }

            _context.Products.Remove(product);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPost("{id}/attributes")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> AddProductAttribute(int id, [FromBody] ProductAttributeDto attributeDto)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null)
            {
                return NotFound();
            }

            var attribute = new ProductAttribute
            {
                ProductId = id,
                AttrName = attributeDto.AttrName,
                AttrValue = attributeDto.AttrValue
            };

            _context.ProductAttributes.Add(attribute);
            await _context.SaveChangesAsync();

            return Ok(attributeDto);
        }

        [HttpGet("filters")]
        public async Task<ActionResult<ProductFiltersDto>> GetProductFilters([FromServices] FilterCacheService cacheService)
        {
            try
            {
                var filters = await cacheService.GetFiltersAsync();
                return Ok(filters);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[FILTERS ERROR] {ex.Message}");
                // Fallback на старую логику если кэш не работает
                return await GetProductFiltersLegacy();
            }
        }

        [HttpPost("filters/clear-cache")]
        public IActionResult ClearFiltersCache([FromServices] FilterCacheService cacheService)
        {
            try
            {
                cacheService.InvalidateFiltersCache();
                return Ok(new { message = "Filters cache cleared successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // Старая логика как fallback
        private async Task<ActionResult<ProductFiltersDto>> GetProductFiltersLegacy()
        {
            var categories = await _context.Categories
                .Select(c => new CategoryFilterDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    ProductCount = c.Products.Count(p => p.IsActive == true)
                })
                .Where(c => c.ProductCount > 0)
                .ToListAsync();

            var prices = await _context.Products
                .Where(p => p.IsActive == true)
                .Select(p => p.Price)
                .ToListAsync();

            // Получаем все атрибуты активных товаров
            var attributeData = await _context.ProductAttributes
                .Where(pa => pa.Product.IsActive == true)
                .Select(pa => new { pa.AttrName, pa.AttrValue, pa.ProductId })
                .ToListAsync();

            Console.WriteLine($"[FILTERS] Total attribute records: {attributeData.Count}");

            // Группируем в памяти
            var attributes = attributeData
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

            Console.WriteLine($"[FILTERS] Attribute groups: {attributes.Count}");
            foreach (var attr in attributes)
            {
                Console.WriteLine($"[FILTERS] Attribute: {attr.Name}, Values: {attr.Values.Count}");
                foreach (var val in attr.Values.Take(3))
                {
                    Console.WriteLine($"[FILTERS]   - {val.Value}: {val.Count}");
                }
            }

            var result = new ProductFiltersDto
            {
                Categories = categories,
                MinPrice = prices.Any() ? prices.Min() : 0,
                MaxPrice = prices.Any() ? prices.Max() : 0,
                Attributes = attributes
            };

            return Ok(result);
        }

        private async Task<ProductDto> MapToProductDto(Product product)
        {
            var userRole = User.FindFirst("role")?.Value ?? User.FindFirst(ClaimTypes.Role)?.Value;
            bool isAdmin = userRole == "Admin";

            return new ProductDto
            {
                Id = product.Id,
                Article = product.Article,
                Name = product.Name,
                Description = product.Description,
                Price = product.Price,
                BasePrice = isAdmin ? product.Price : null,
                CostPrice = isAdmin ? product.CostPrice : null,
                Stock = product.Stock,
                CategoryId = product.CategoryId,
                CategoryName = product.Category?.Name,
                ImageUrl = GetImageUrlForProduct(product), // Автоматическая подстановка изображения
                IsActive = product.IsActive,
                CreatedAt = product.CreatedAt,
                AverageRating = 0,
                ReviewCount = 0,
                Attributes = product.ProductAttributes.Select(a => new ProductAttributeDto
                {
                    AttrName = a.AttrName,
                    AttrValue = a.AttrValue
                }).ToList()
            };
        }

        private async Task<List<int>> GetCategoryAndSubcategoryIds(int parentId)
        {
            var categoryIds = new List<int> { parentId };
            var subcategories = await _context.Categories
                .Where(c => c.ParentId == parentId)
                .Select(c => c.Id)
                .ToListAsync();
            categoryIds.AddRange(subcategories);
            return categoryIds;
        }
    }

    // DTOs for filters
    public class ProductFiltersDto
    {
        public List<CategoryFilterDto> Categories { get; set; } = new();
        public decimal MinPrice { get; set; }
        public decimal MaxPrice { get; set; }
        public List<AttributeFilterDto> Attributes { get; set; } = new();
    }

    public class CategoryFilterDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int ProductCount { get; set; }
    }

    public class AttributeFilterDto
    {
        public string? Name { get; set; }
        public List<AttributeValueDto> Values { get; set; } = new();
    }

    public class AttributeValueDto
    {
        public string? Value { get; set; }
        public int Count { get; set; }
        public List<AttributeSubgroupDto>? Subgroups { get; set; }
    }

    public class AttributeSubgroupDto
    {
        public string Name { get; set; } = string.Empty;
        public int Count { get; set; }
        public List<string> Keywords { get; set; } = new();
    }

    // DTOs for create/update operations
    public class CreateProductDto
    {
        public string Article { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public decimal CostPrice { get; set; }
        public int Stock { get; set; }
        public int? CategoryId { get; set; }
        public string? ImageUrl { get; set; }
        public bool? IsActive { get; set; }
        public List<ProductAttributeDto>? Attributes { get; set; }
    }

    public class UpdateProductDto
    {
        public string Article { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public decimal CostPrice { get; set; }
        public int Stock { get; set; }
        public int? CategoryId { get; set; }
        public string? ImageUrl { get; set; }
        public bool? IsActive { get; set; }
        public List<ProductAttributeDto>? Attributes { get; set; }
    }

    // DTO for restock operation
    public class RestockDto
    {
        public int Quantity { get; set; }
    }
}
