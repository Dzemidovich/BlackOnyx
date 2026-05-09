namespace Diplom.DTOs
{
    public class ProductDetailDto
    {
        public ProductDto Product { get; set; } = null!;
        public List<RelatedProductDto> RelatedProducts { get; set; } = new();
        public List<BreadcrumbItem> Breadcrumb { get; set; } = new();
    }

    public class RelatedProductDto
    {
        public int Id { get; set; }
        public string Article { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string? ImageUrl { get; set; }
        public int Stock { get; set; }
    }

    public class BreadcrumbItem
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
    }
}
