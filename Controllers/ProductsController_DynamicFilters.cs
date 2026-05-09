using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Diplom.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Diplom.Controllers
{
    // Partial class extension for dynamic filters
    public partial class ProductsController
    {
        // ===== DYNAMIC FILTERS FOR CATEGORY =====
        [HttpGet("categories/{categoryId}/filters")]
        public async Task<ActionResult<CategoryDynamicFiltersDto>> GetCategoryDynamicFilters(int categoryId)
        {
            // Get all unique attributes and their values for this category
            var filters = await _context.ProductAttributes
                .Where(pa => pa.Product.CategoryId == categoryId && pa.Product.IsActive == true)
                .GroupBy(pa => pa.AttrName)
                .Select(g => new DynamicFilterDto
                {
                    Name = g.Key,
                    Values = g.GroupBy(pa => pa.AttrValue)
                              .Select(v => new FilterValueDto
                              {
                                  Value = v.Key,
                                  Count = v.Count()
                              })
                              .OrderByDescending(v => v.Count)
                              .Take(20) // Limit to top 20 values
                              .ToList()
                })
                .ToListAsync();

            return Ok(new CategoryDynamicFiltersDto { Filters = filters });
        }

        // ===== MASS CATEGORIZATION =====
        [HttpGet("uncategorized")]
        public async Task<ActionResult<List<UncategorizedProductDto>>> GetUncategorizedProducts(
            int page = 1,
            int pageSize = 50)
        {
            var products = await _context.Products
                .Where(p => p.CategoryId == null && p.IsActive == true)
                .OrderBy(p => p.Name)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new UncategorizedProductDto
                {
                    Id = p.Id,
                    Article = p.Article,
                    Name = p.Name,
                    Description = p.Description,
                    ImageUrl = p.ImageUrl,
                    AttributesCount = p.ProductAttributes.Count()
                })
                .ToListAsync();

            var totalCount = await _context.Products
                .Where(p => p.CategoryId == null && p.IsActive == true)
                .CountAsync();

            Response.Headers["X-Total-Count"] = totalCount.ToString();
            Response.Headers["X-Total-Pages"] = ((totalCount + pageSize - 1) / pageSize).ToString();

            return Ok(products);
        }

        [HttpPost("mass-categorize")]
        public async Task<ActionResult> MassCategorizeProducts([FromBody] MassCategorizationDto request)
        {
            if (request.ProductIds == null || !request.ProductIds.Any())
            {
                return BadRequest("No products selected");
            }

            var products = await _context.Products
                .Where(p => request.ProductIds.Contains(p.Id))
                .ToListAsync();

            foreach (var product in products)
            {
                product.CategoryId = request.CategoryId;
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = $"Categorized {products.Count} products", count = products.Count });
        }

        [HttpGet("categorization-suggestions")]
        public async Task<ActionResult<List<CategorizationSuggestionDto>>> GetCategorizationSuggestions(int productId)
        {
            var product = await _context.Products
                .Include(p => p.ProductAttributes)
                .FirstOrDefaultAsync(p => p.Id == productId);

            if (product == null)
            {
                return NotFound();
            }

            // Simple keyword-based suggestions
            var suggestions = new List<CategorizationSuggestionDto>();
            var searchText = (product.Name + " " + product.Description).ToLower();

            var categories = await _context.Categories.ToListAsync();

            foreach (var category in categories)
            {
                var score = 0;
                var keywords = new List<string>();

                // Simple keyword matching
                if (searchText.Contains(category.Name.ToLower()))
                {
                    score += 10;
                    keywords.Add(category.Name);
                }

                if (score > 0)
                {
                    suggestions.Add(new CategorizationSuggestionDto
                    {
                        CategoryId = category.Id,
                        CategoryName = category.Name,
                        Score = score,
                        MatchedKeywords = keywords
                    });
                }
            }

            return Ok(suggestions.OrderByDescending(s => s.Score).Take(5).ToList());
        }
    }

    // DTOs for dynamic filters
    public class CategoryDynamicFiltersDto
    {
        public List<DynamicFilterDto> Filters { get; set; } = new();
    }

    public class DynamicFilterDto
    {
        public string? Name { get; set; }
        public List<FilterValueDto> Values { get; set; } = new();
    }

    public class FilterValueDto
    {
        public string? Value { get; set; }
        public int Count { get; set; }
    }

    // DTOs for mass categorization
    public class UncategorizedProductDto
    {
        public int Id { get; set; }
        public string Article { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public int AttributesCount { get; set; }
    }

    public class MassCategorizationDto
    {
        public List<int> ProductIds { get; set; } = new();
        public int CategoryId { get; set; }
    }

    public class CategorizationSuggestionDto
    {
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public int Score { get; set; }
        public List<string> MatchedKeywords { get; set; } = new();
    }
}
