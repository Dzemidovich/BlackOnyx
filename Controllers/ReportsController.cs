using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Text;
using Diplom.Models;

namespace Diplom.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class ReportsController : ControllerBase
    {
        private readonly ToolShopDbContext _context;

        public ReportsController(ToolShopDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// GET /api/reports/sales
        /// Returns sales summary for a date range
        /// </summary>
        [HttpGet("sales")]
        public async Task<ActionResult<SalesReportDto>> GetSalesReport(
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate)
        {
            // Default to last 30 days if not specified
            var start = startDate ?? DateTime.Now.AddDays(-30);
            var end = endDate ?? DateTime.Now;

            // Ensure end date includes the full day
            end = end.Date.AddDays(1).AddTicks(-1);

            var orders = await _context.Orders
                .Where(o => o.CreatedAt >= start && o.CreatedAt <= end)
                .ToListAsync();

            var completedOrders = orders.Where(o => o.Status == "Завершен").ToList();

            var totalRevenue = completedOrders.Sum(o => o.TotalAmount ?? 0);
            var orderCount = orders.Count;
            var completedOrderCount = completedOrders.Count;
            var averageOrderValue = completedOrderCount > 0 ? totalRevenue / completedOrderCount : 0;

            // Get top product
            var topProduct = await _context.OrderItems
                .Include(oi => oi.Product)
                .Include(oi => oi.Order)
                .Where(oi => oi.Order.CreatedAt >= start && oi.Order.CreatedAt <= end)
                .GroupBy(oi => new { oi.ProductId, oi.Product.Name })
                .Select(g => new
                {
                    ProductId = g.Key.ProductId,
                    ProductName = g.Key.Name,
                    TotalQuantity = g.Sum(oi => oi.Quantity),
                    TotalRevenue = g.Sum(oi => oi.Total)
                })
                .OrderByDescending(x => x.TotalRevenue)
                .FirstOrDefaultAsync();

            var report = new SalesReportDto
            {
                StartDate = start,
                EndDate = end,
                TotalRevenue = totalRevenue,
                OrderCount = orderCount,
                CompletedOrderCount = completedOrderCount,
                AverageOrderValue = averageOrderValue,
                TopProductName = topProduct?.ProductName ?? "N/A",
                TopProductQuantity = topProduct?.TotalQuantity ?? 0,
                TopProductRevenue = topProduct?.TotalRevenue ?? 0
            };

            return Ok(report);
        }

        /// <summary>
        /// GET /api/reports/sales/details
        /// Returns detailed list of orders for a date range
        /// </summary>
        [HttpGet("sales/details")]
        public async Task<ActionResult<IEnumerable<SalesDetailDto>>> GetSalesDetails(
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate)
        {
            var start = startDate ?? DateTime.Now.AddDays(-30);
            var end = endDate ?? DateTime.Now;
            end = end.Date.AddDays(1).AddTicks(-1);

            var orders = await _context.Orders
                .Include(o => o.User)
                .Where(o => o.CreatedAt >= start && o.CreatedAt <= end)
                .OrderByDescending(o => o.CreatedAt)
                .Select(o => new SalesDetailDto
                {
                    OrderId = o.Id,
                    OrderDate = o.CreatedAt ?? DateTime.Now,
                    CustomerName = o.User.FullName ?? o.User.Email,
                    CustomerEmail = o.User.Email,
                    IsLegalEntity = o.User.IsLegalEntity,
                    CompanyName = o.User.CompanyName,
                    ItemsCount = _context.OrderItems.Where(oi => oi.OrderId == o.Id).Sum(oi => oi.Quantity),
                    TotalAmount = o.TotalAmount ?? 0,
                    Status = o.Status ?? "Новый",
                    Comment = o.Comment
                })
                .ToListAsync();

            return Ok(orders);
        }

        /// <summary>
        /// GET /api/reports/products/top
        /// Returns top selling products by quantity and revenue
        /// </summary>
        [HttpGet("products/top")]
        public async Task<ActionResult<IEnumerable<TopProductDto>>> GetTopProducts(
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] int limit = 10)
        {
            var start = startDate ?? DateTime.Now.AddDays(-30);
            var end = endDate ?? DateTime.Now;
            end = end.Date.AddDays(1).AddTicks(-1);

            var topProducts = await _context.OrderItems
                .Include(oi => oi.Product)
                .Include(oi => oi.Order)
                .Where(oi => oi.Order.CreatedAt >= start && oi.Order.CreatedAt <= end)
                .GroupBy(oi => new
                {
                    oi.ProductId,
                    oi.Product.Article,
                    oi.Product.Name,
                    oi.Product.ImageUrl
                })
                .Select(g => new TopProductDto
                {
                    ProductId = g.Key.ProductId,
                    Article = g.Key.Article,
                    ProductName = g.Key.Name,
                    ImageUrl = g.Key.ImageUrl,
                    TotalQuantitySold = g.Sum(oi => oi.Quantity),
                    TotalRevenue = g.Sum(oi => oi.Total),
                    OrderCount = g.Select(oi => oi.OrderId).Distinct().Count()
                })
                .OrderByDescending(p => p.TotalRevenue)
                .Take(limit)
                .ToListAsync();

            return Ok(topProducts);
        }

        /// <summary>
        /// GET /api/reports/customers
        /// Returns customer statistics
        /// </summary>
        [HttpGet("customers")]
        public async Task<ActionResult<CustomerStatsDto>> GetCustomerStats()
        {
            var totalCustomers = await _context.Users
                .Where(u => u.Role == "Customer")
                .CountAsync();

            var activeCustomers = await _context.Users
                .Where(u => u.Role == "Customer" && u.IsActive == true)
                .CountAsync();

            var b2bCustomers = await _context.Users
                .Where(u => u.Role == "Customer" && u.IsLegalEntity == true)
                .CountAsync();

            var b2cCustomers = await _context.Users
                .Where(u => u.Role == "Customer" && u.IsLegalEntity == false)
                .CountAsync();

            var customersWithOrders = await _context.Orders
                .Select(o => o.UserId)
                .Distinct()
                .CountAsync();

            var totalOrders = await _context.Orders.CountAsync();
            var averageOrdersPerCustomer = customersWithOrders > 0 
                ? (decimal)totalOrders / customersWithOrders 
                : 0;

            var completedOrders = await _context.Orders
                .Where(o => o.Status == "Завершен")
                .ToListAsync();

            var totalRevenue = completedOrders.Sum(o => o.TotalAmount ?? 0);
            var averageRevenuePerCustomer = customersWithOrders > 0 
                ? totalRevenue / customersWithOrders 
                : 0;

            var stats = new CustomerStatsDto
            {
                TotalCustomers = totalCustomers,
                ActiveCustomers = activeCustomers,
                B2BCustomers = b2bCustomers,
                B2CCustomers = b2cCustomers,
                CustomersWithOrders = customersWithOrders,
                AverageOrdersPerCustomer = averageOrdersPerCustomer,
                AverageRevenuePerCustomer = averageRevenuePerCustomer
            };

            return Ok(stats);
        }

        /// <summary>
        /// GET /api/reports/sales/export
        /// Exports sales report as CSV file
        /// </summary>
        [HttpGet("sales/export")]
        public async Task<IActionResult> ExportSalesCSV(
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate)
        {
            var start = startDate ?? DateTime.Now.AddDays(-30);
            var end = endDate ?? DateTime.Now;
            end = end.Date.AddDays(1).AddTicks(-1);

            var orders = await _context.Orders
                .Include(o => o.User)
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
                .Where(o => o.CreatedAt >= start && o.CreatedAt <= end)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();

            var csv = new StringBuilder();
            
            // CSV Header
            csv.AppendLine("Order ID,Date,Customer,Email,Company,Type,Status,Items Count,Total Amount,Comment");

            // CSV Rows
            foreach (var order in orders)
            {
                var itemsCount = order.OrderItems.Sum(oi => oi.Quantity);
                var customerType = order.User.IsLegalEntity ? "B2B" : "B2C";
                var companyName = order.User.IsLegalEntity ? order.User.CompanyName : "";
                var comment = order.Comment?.Replace("\"", "\"\"") ?? ""; // Escape quotes

                csv.AppendLine($"{order.Id}," +
                    $"{order.CreatedAt:yyyy-MM-dd HH:mm}," +
                    $"\"{order.User.FullName ?? order.User.Email}\"," +
                    $"{order.User.Email}," +
                    $"\"{companyName}\"," +
                    $"{customerType}," +
                    $"{order.Status}," +
                    $"{itemsCount}," +
                    $"{order.TotalAmount:F2}," +
                    $"\"{comment}\"");
            }

            var fileName = $"sales_report_{start:yyyy-MM-dd}_to_{end:yyyy-MM-dd}.csv";
            var bytes = Encoding.UTF8.GetBytes(csv.ToString());
            
            return File(bytes, "text/csv", fileName);
        }
    }

    // DTOs for Reports
    public class SalesReportDto
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal TotalRevenue { get; set; }
        public int OrderCount { get; set; }
        public int CompletedOrderCount { get; set; }
        public decimal AverageOrderValue { get; set; }
        public string TopProductName { get; set; } = string.Empty;
        public int TopProductQuantity { get; set; }
        public decimal TopProductRevenue { get; set; }
    }

    public class SalesDetailDto
    {
        public int OrderId { get; set; }
        public DateTime OrderDate { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerEmail { get; set; } = string.Empty;
        public bool IsLegalEntity { get; set; }
        public string? CompanyName { get; set; }
        public int ItemsCount { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? Comment { get; set; }
    }

    public class TopProductDto
    {
        public int ProductId { get; set; }
        public string Article { get; set; } = string.Empty;
        public string ProductName { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public int TotalQuantitySold { get; set; }
        public decimal TotalRevenue { get; set; }
        public int OrderCount { get; set; }
    }

    public class CustomerStatsDto
    {
        public int TotalCustomers { get; set; }
        public int ActiveCustomers { get; set; }
        public int B2BCustomers { get; set; }
        public int B2CCustomers { get; set; }
        public int CustomersWithOrders { get; set; }
        public decimal AverageOrdersPerCustomer { get; set; }
        public decimal AverageRevenuePerCustomer { get; set; }
    }
}
