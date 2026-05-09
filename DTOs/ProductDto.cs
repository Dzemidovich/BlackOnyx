using System.Text.Json.Serialization;

namespace Diplom.DTOs
{
    public class ProductDto
    {
        public int Id { get; set; }
        public string Article { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; } // Calculated price for user
        public decimal? BasePrice { get; set; } // Original base price (null for non-admins)
        public decimal? CostPrice { get; set; } // Cost price (null for non-admins)
        public int Stock { get; set; }
        public int? CategoryId { get; set; }
        public string? ImageUrl { get; set; }
        public bool? IsActive { get; set; }
        public DateTime? CreatedAt { get; set; }

        // Вместо полной категории - только название
        public string? CategoryName { get; set; }

        // Рейтинг и отзывы
        public double AverageRating { get; set; }
        public int ReviewCount { get; set; }

        // Атрибуты как плоский список
        public List<ProductAttributeDto> Attributes { get; set; } = new();
    }

    public class ProductAttributeDto
    {
        public string? AttrName { get; set; }
        public string? AttrValue { get; set; }
    }
}
