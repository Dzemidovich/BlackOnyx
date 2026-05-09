using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Diplom.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;

namespace Diplom.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoriesController : ControllerBase
    {
        private readonly ToolShopDbContext _context;

        public CategoriesController(ToolShopDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<CategoryDto>>> GetCategories()
        {
            var categories = await _context.Categories
                .Include(c => c.Products)
                .Select(c => new CategoryDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    ParentId = c.ParentId,
                    ProductCount = c.Products.Count
                })
                .ToListAsync();

            return Ok(categories);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<CategoryDto>> GetCategory(int id)
        {
            var category = await _context.Categories
                .Include(c => c.Products)
                .Where(c => c.Id == id)
                .Select(c => new CategoryDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    ParentId = c.ParentId,
                    ProductCount = c.Products.Count
                })
                .FirstOrDefaultAsync();

            if (category == null)
            {
                return NotFound();
            }

            return category;
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<CategoryDto>> CreateCategory(CreateCategoryDto createCategory)
        {
            if (createCategory == null || string.IsNullOrEmpty(createCategory.Name))
            {
                return BadRequest("Название категории обязательно");
            }

            // Check if category name already exists
            if (await _context.Categories.AnyAsync(c => c.Name == createCategory.Name))
            {
                return BadRequest("Категория с таким названием уже существует");
            }

            // Check if parent exists if specified
            if (createCategory.ParentId.HasValue)
            {
                var parentExists = await _context.Categories.AnyAsync(c => c.Id == createCategory.ParentId.Value);
                if (!parentExists)
                {
                    return BadRequest("Родительская категория не найдена");
                }
            }

            var category = new Category
            {
                Name = createCategory.Name,
                ParentId = createCategory.ParentId
            };

            _context.Categories.Add(category);
            await _context.SaveChangesAsync();

            var categoryDto = new CategoryDto
            {
                Id = category.Id,
                Name = category.Name,
                ParentId = category.ParentId,
                ProductCount = 0
            };

            return CreatedAtAction(nameof(GetCategory), new { id = category.Id }, categoryDto);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> UpdateCategory(int id, UpdateCategoryDto updateCategory)
        {
            if (updateCategory == null || string.IsNullOrEmpty(updateCategory.Name))
            {
                return BadRequest("Название категории обязательно");
            }

            var category = await _context.Categories.FindAsync(id);
            if (category == null)
            {
                return NotFound();
            }

            // Check if name conflicts with other categories
            if (await _context.Categories.AnyAsync(c => c.Name == updateCategory.Name && c.Id != id))
            {
                return BadRequest("Категория с таким названием уже существует");
            }

            // Check if parent exists if specified
            if (updateCategory.ParentId.HasValue)
            {
                var parentExists = await _context.Categories.AnyAsync(c => c.Id == updateCategory.ParentId.Value);
                if (!parentExists)
                {
                    return BadRequest("Родительская категория не найдена");
                }

                // Prevent circular references
                if (updateCategory.ParentId.HasValue && updateCategory.ParentId.Value == id)
                {
                    return BadRequest("Категория не может быть родителем сама себе");
                }
            }

            category.Name = updateCategory.Name;
            category.ParentId = updateCategory.ParentId;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var category = await _context.Categories
                .Include(c => c.Products)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (category == null)
            {
                return NotFound();
            }

            // Check if category has products
            if (category.Products.Any())
            {
                return BadRequest("Нельзя удалить категорию, содержащую товары");
            }

            // Check if category has subcategories
            var hasSubcategories = await _context.Categories.AnyAsync(c => c.ParentId == id);
            if (hasSubcategories)
            {
                return BadRequest("Нельзя удалить категорию, содержащую подкатегории");
            }

            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("tree")]
        public async Task<ActionResult<IEnumerable<CategoryTreeDto>>> GetCategoryTree()
        {
            var categories = await _context.Categories.ToListAsync();

            var tree = BuildCategoryTree(categories, null);
            return Ok(tree);
        }

        private List<CategoryTreeDto> BuildCategoryTree(List<Category> allCategories, int? parentId)
        {
            return allCategories
                .Where(c => c.ParentId == parentId)
                .Select(c => new CategoryTreeDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    ParentId = c.ParentId,
                    Children = BuildCategoryTree(allCategories, c.Id)
                })
                .ToList();
        }
    }

    // DTOs
    public class CategoryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int? ParentId { get; set; }
        public int ProductCount { get; set; }
    }

    public class CreateCategoryDto
    {
        public string Name { get; set; } = string.Empty;
        public int? ParentId { get; set; }
    }

    public class UpdateCategoryDto
    {
        public string Name { get; set; } = string.Empty;
        public int? ParentId { get; set; }
    }

    public class CategoryTreeDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int? ParentId { get; set; }
        public List<CategoryTreeDto> Children { get; set; } = new List<CategoryTreeDto>();
    }
}
