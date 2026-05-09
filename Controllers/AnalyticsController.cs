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
    [Authorize(Roles = "Admin,Manager")]
    public class AnalyticsController : ControllerBase
    {
        private readonly ToolShopDbContext _context;

        public AnalyticsController(ToolShopDbContext context)
        {
            _context = context;
        }

        // GET: api/analytics/dashboard
        [HttpGet("dashboard")]
        public async Task<ActionResult<DashboardDto>> GetDashboard()
        {
            var now = DateTime.UtcNow;
            var startOfMonth = new DateTime(now.Year, now.Month, 1);
            var startOfYear = new DateTime(now.Year, 1, 1);

            // Основные метрики
            var totalProducts = await _context.Products.CountAsync(p => p.IsActive == true);
            var totalOrders = await _context.Orders.CountAsync();
            var totalUsers = await _context.Users.CountAsync();
            var totalRevenue = await _context.Orders
                .Where(o => o.Status == "Завершен")
                .SumAsync(o => o.TotalAmount ?? 0);

            // Метрики за текущий месяц
            var monthlyOrders = await _context.Orders
                .CountAsync(o => o.CreatedAt >= startOfMonth);
            var monthlyRevenue = await _context.Orders
                .Where(o => o.CreatedAt >= startOfMonth && o.Status == "Завершен")
                .SumAsync(o => o.TotalAmount ?? 0);

            // Метрики за год
            var yearlyOrders = await _context.Orders
                .CountAsync(o => o.CreatedAt >= startOfYear);
            var yearlyRevenue = await _context.Orders
                .Where(o => o.CreatedAt >= startOfYear && o.Status == "Завершен")
                .SumAsync(o => o.TotalAmount ?? 0);

            // Новые пользователи за месяц
            var newUsersThisMonth = await _context.Users
                .CountAsync(u => u.CreatedAt >= startOfMonth);

            var dashboard = new DashboardDto
            {
                TotalProducts = totalProducts,
                TotalOrders = totalOrders,
                TotalUsers = totalUsers,
                TotalRevenue = totalRevenue,
                MonthlyOrders = monthlyOrders,
                MonthlyRevenue = monthlyRevenue,
                YearlyOrders = yearlyOrders,
                YearlyRevenue = yearlyRevenue,
                NewUsersThisMonth = newUsersThisMonth
            };

            return Ok(dashboard);
        }

        // GET: api/analytics/sales/chart?period=week&year=2024&month=1&week=1
        [HttpGet("sales/chart")]
        public async Task<ActionResult<ChartDataDto>> GetSalesChart(string period = "week", int? year = null, int? month = null, int? week = null)
        {
            var now = DateTime.UtcNow;
            year ??= now.Year;
            month ??= now.Month;

            IQueryable<Order> query = _context.Orders
                .Where(o => o.Status == "Завершен" && o.CreatedAt != null);

            List<ChartDataPointDto> dataPoints;

            if (period.ToLower() == "year")
            {
                // Данные по месяцам за год
                query = query.Where(o => o.CreatedAt!.Value.Year == year);

                var rawData = await query
                    .GroupBy(o => o.CreatedAt!.Value.Month)
                    .Select(g => new { Month = g.Key, Value = g.Sum(o => o.TotalAmount ?? 0) })
                    .OrderBy(d => d.Month)
                    .ToListAsync();

                // Форматировать на клиенте
                dataPoints = rawData.Select(d => new ChartDataPointDto
                {
                    Label = new DateTime(year.Value, d.Month, 1).ToString("MMM yyyy"),
                    Value = d.Value
                }).ToList();

                // Заполнить месяцы без продаж
                for (int m = 1; m <= 12; m++)
                {
                    var monthName = new DateTime(year.Value, m, 1).ToString("MMM yyyy");
                    if (!dataPoints.Any(d => d.Label == monthName))
                    {
                        dataPoints.Add(new ChartDataPointDto { Label = monthName, Value = 0 });
                    }
                }

                dataPoints = dataPoints.OrderBy(d => DateTime.ParseExact(d.Label, "MMM yyyy", System.Globalization.CultureInfo.CurrentCulture)).ToList();
            }
            else if (period.ToLower() == "month")
            {
                // Данные по дням за месяц
                query = query.Where(o => o.CreatedAt!.Value.Year == year && o.CreatedAt!.Value.Month == month);

                // Получить сырые данные
                var rawData = await query
                    .GroupBy(o => o.CreatedAt!.Value.Day)
                    .Select(g => new { Day = g.Key, Value = g.Sum(o => o.TotalAmount ?? 0) })
                    .OrderBy(d => d.Day)
                    .ToListAsync();

                // Форматировать на клиенте
                dataPoints = rawData.Select(d => new ChartDataPointDto
                {
                    Label = d.Day.ToString(),
                    Value = d.Value
                }).ToList();

                // Заполнить дни без продаж
                var daysInMonth = DateTime.DaysInMonth(year.Value, month.Value);
                for (int d = 1; d <= daysInMonth; d++)
                {
                    if (!dataPoints.Any(dp => dp.Label == d.ToString()))
                    {
                        dataPoints.Add(new ChartDataPointDto { Label = d.ToString(), Value = 0 });
                    }
                }

                dataPoints = dataPoints.OrderBy(d => int.Parse(d.Label)).ToList();
            }
            else // week - последние 7 дней
            {
                // Показываем последние 7 дней от сегодня
                var endDate = now.Date;
                var startDate = endDate.AddDays(-6);
                
                query = query.Where(o => o.CreatedAt >= startDate && o.CreatedAt <= endDate.AddDays(1).AddSeconds(-1));

                // Получить сырые данные
                var rawDataPoints = await query
                    .ToListAsync();

                // Группировать по дням на клиенте
                var groupedData = rawDataPoints
                    .GroupBy(o => o.CreatedAt!.Value.Date)
                    .Select(g => new { Date = g.Key, Value = g.Sum(o => o.TotalAmount ?? 0) })
                    .ToDictionary(x => x.Date, x => x.Value);

                // Создать точки данных для всех 7 дней
                dataPoints = new List<ChartDataPointDto>();
                var currentDate = startDate;
                while (currentDate <= endDate)
                {
                    var value = groupedData.ContainsKey(currentDate) ? groupedData[currentDate] : 0;
                    dataPoints.Add(new ChartDataPointDto
                    {
                        Label = GetDayName(currentDate),
                        Value = value
                    });
                    currentDate = currentDate.AddDays(1);
                }
            }

            var chartData = new ChartDataDto
            {
                Labels = dataPoints.Select(d => d.Label).ToArray(),
                Data = dataPoints.Select(d => d.Value).ToArray()
            };

            return Ok(chartData);
        }

        private (DateTime startDate, DateTime endDate) GetWeekDateRange(int year, int month, int week)
        {
            var firstDayOfMonth = new DateTime(year, month, 1);
            
            // Определить первый понедельник месяца
            var firstMonday = firstDayOfMonth.DayOfWeek == DayOfWeek.Monday 
                ? firstDayOfMonth 
                : firstDayOfMonth.AddDays((8 - (int)firstDayOfMonth.DayOfWeek) % 7);

            // Если неделя не указана - берем текущую неделю
            int effectiveWeek = week;
            if (effectiveWeek <= 0)
            {
                var now = DateTime.UtcNow;
                if (now.Year == year && now.Month == month)
                {
                    var weekNumber = GetWeekNumberInMonth(now, firstMonday);
                    effectiveWeek = weekNumber;
                }
                else
                {
                    effectiveWeek = 1;
                }
            }

            var startDate = firstMonday.AddDays((effectiveWeek - 1) * 7);
            var endDate = startDate.AddDays(6);

            // Ограничить диапазон границами месяца
            var lastDayOfMonth = new DateTime(year, month, DateTime.DaysInMonth(year, month));
            if (endDate > lastDayOfMonth)
                endDate = lastDayOfMonth;

            return (startDate, endDate);
        }

        private int GetWeekNumberInMonth(DateTime date, DateTime firstMonday)
        {
            var daysFromFirstMonday = (date - firstMonday).Days;
            return (daysFromFirstMonday / 7) + 1;
        }

        private string GetDayName(DateTime date)
        {
            var dayNames = new[] { "Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб" };
            return $"{dayNames[(int)date.DayOfWeek]} {date.Day}";
        }

        // GET: api/analytics/products/popular?type=revenue&limit=10
        [HttpGet("products/popular")]
        public async Task<ActionResult<IEnumerable<ProductAnalyticsDto>>> GetPopularProducts(string type = "revenue", int limit = 10)
        {
            var query = _context.OrderItems
                .Include(oi => oi.Product)
                .Where(oi => oi.Order.Status == "Завершен");

            IEnumerable<ProductAnalyticsDto> products;

            if (type.ToLower() == "quantity")
            {
                // По количеству продаж
                products = await query
                    .GroupBy(oi => oi.ProductId)
                    .Select(g => new ProductAnalyticsDto
                    {
                        ProductId = g.Key,
                        ProductName = g.First().Product.Name,
                        ProductArticle = g.First().Product.Article,
                        TotalSold = g.Sum(oi => oi.Quantity),
                        TotalRevenue = g.Sum(oi => oi.Total)
                    })
                    .OrderByDescending(p => p.TotalSold)
                    .Take(limit)
                    .ToListAsync();
            }
            else
            {
                // По выручке (по умолчанию)
                products = await query
                    .GroupBy(oi => oi.ProductId)
                    .Select(g => new ProductAnalyticsDto
                    {
                        ProductId = g.Key,
                        ProductName = g.First().Product.Name,
                        ProductArticle = g.First().Product.Article,
                        TotalSold = g.Sum(oi => oi.Quantity),
                        TotalRevenue = g.Sum(oi => oi.Total)
                    })
                    .OrderByDescending(p => p.TotalRevenue)
                    .Take(limit)
                    .ToListAsync();
            }

            return Ok(products);
        }

        // GET: api/analytics/categories/stats
        [HttpGet("categories/stats")]
        public async Task<ActionResult<IEnumerable<CategoryAnalyticsDto>>> GetCategoryStats()
        {
            var categories = await _context.OrderItems
                .Include(oi => oi.Product)
                .ThenInclude(p => p.Category)
                .Where(oi => oi.Order.Status == "Завершен" && oi.Product.CategoryId != null && oi.Product.Category != null)
                .GroupBy(oi => oi.Product.CategoryId)
                .Select(g => new CategoryAnalyticsDto
                {
                    CategoryId = g.Key!.Value,
                    CategoryName = g.First().Product.Category.Name,
                    TotalSold = g.Sum(oi => oi.Quantity),
                    TotalRevenue = g.Sum(oi => oi.Total),
                    OrderCount = g.Select(oi => oi.OrderId).Distinct().Count()
                })
                .OrderByDescending(c => c.TotalRevenue)
                .ToListAsync();

            return Ok(categories);
        }

        // GET: api/analytics/margin/products?limit=10
        [HttpGet("margin/products")]
        public async Task<ActionResult<IEnumerable<ProductMarginDto>>> GetProductMargin(int limit = 10)
        {
            if (limit <= 0) limit = 10;

            var query = _context.OrderItems
                .Include(oi => oi.Product)
                .Where(oi => oi.Order.Status == "Завершен");

            var data = await query
                .GroupBy(oi => oi.ProductId)
                .Select(g => new
                {
                    ProductId = g.Key,
                    ProductName = g.First().Product.Name,
                    ProductArticle = g.First().Product.Article,
                    UnitsSold = g.Sum(oi => oi.Quantity),
                    Revenue = g.Sum(oi => oi.Total),
                    Cost = g.Sum(oi => oi.Product.CostPrice * oi.Quantity)
                })
                .ToListAsync();

            var result = data
                .Select(x =>
                {
                    var profit = x.Revenue - x.Cost;
                    var marginPercent = x.Revenue > 0 ? (profit / x.Revenue) * 100 : 0;
                    return new ProductMarginDto
                    {
                        ProductId = x.ProductId,
                        ProductName = x.ProductName,
                        ProductArticle = x.ProductArticle,
                        UnitsSold = x.UnitsSold,
                        Revenue = x.Revenue,
                        Cost = x.Cost,
                        Profit = profit,
                        MarginPercent = marginPercent
                    };
                })
                .OrderByDescending(p => p.Profit)
                .Take(limit)
                .ToList();

            return Ok(result);
        }

        // GET: api/analytics/margin/categories
        [HttpGet("margin/categories")]
        public async Task<ActionResult<IEnumerable<CategoryMarginDto>>> GetCategoryMargin()
        {
            var query = _context.OrderItems
                .Include(oi => oi.Product)
                .ThenInclude(p => p.Category)
                .Where(oi => oi.Order.Status == "Завершен" && oi.Product.CategoryId != null && oi.Product.Category != null);

            var data = await query
                .GroupBy(oi => oi.Product.CategoryId)
                .Select(g => new
                {
                    CategoryId = g.Key!.Value,
                    CategoryName = g.First().Product.Category.Name,
                    UnitsSold = g.Sum(oi => oi.Quantity),
                    Revenue = g.Sum(oi => oi.Total),
                    Cost = g.Sum(oi => oi.Product.CostPrice * oi.Quantity),
                    OrderCount = g.Select(oi => oi.OrderId).Distinct().Count()
                })
                .ToListAsync();

            var result = data
                .Select(x =>
                {
                    var profit = x.Revenue - x.Cost;
                    var marginPercent = x.Revenue > 0 ? (profit / x.Revenue) * 100 : 0;
                    return new CategoryMarginDto
                    {
                        CategoryId = x.CategoryId,
                        CategoryName = x.CategoryName,
                        UnitsSold = x.UnitsSold,
                        Revenue = x.Revenue,
                        Cost = x.Cost,
                        Profit = profit,
                        MarginPercent = marginPercent,
                        OrderCount = x.OrderCount
                    };
                })
                .OrderByDescending(c => c.Profit)
                .ToList();

            return Ok(result);
        }

        // GET: api/analytics/financial/report?start=2024-01-01&end=2024-12-31
        [HttpGet("financial/report")]
        public async Task<ActionResult<FinancialReportDto>> GetFinancialReport(DateTime? start = null, DateTime? end = null)
        {
            start ??= DateTime.UtcNow.AddMonths(-1);
            end ??= DateTime.UtcNow;

            var orders = await _context.OrderItems
                .Include(oi => oi.Product)
                .Where(oi => oi.Order.Status == "Завершен" &&
                            oi.Order.CreatedAt >= start && oi.Order.CreatedAt <= end)
                .ToListAsync();

            var totalRevenue = orders.Sum(oi => oi.Total);
            var totalCost = orders.Sum(oi => oi.Product.CostPrice * oi.Quantity);
            var grossProfit = totalRevenue - totalCost;
            var profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

            var report = new FinancialReportDto
            {
                PeriodStart = start.Value,
                PeriodEnd = end.Value,
                TotalRevenue = totalRevenue,
                TotalCost = totalCost,
                GrossProfit = grossProfit,
                ProfitMargin = profitMargin,
                TotalOrders = orders.Select(oi => oi.OrderId).Distinct().Count(),
                TotalItemsSold = orders.Sum(oi => oi.Quantity)
            };

            return Ok(report);
        }

        // GET: api/analytics/users/new-registrations?year=2025
        [HttpGet("users/new-registrations")]
        public async Task<ActionResult<ChartDataDto>> GetNewUserRegistrations(int? year = null)
        {
            year ??= DateTime.UtcNow.Year;
            
            var result = new List<ChartDataPointDto>();
            var months = new[] { "Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек" };
            
            for (int m = 1; m <= 12; m++)
            {
                var startDate = new DateTime(year.Value, m, 1);
                var endDate = startDate.AddMonths(1).AddDays(-1);
                
                var count = await _context.Users
                    .CountAsync(u => u.CreatedAt >= startDate && u.CreatedAt <= endDate);
                
                result.Add(new ChartDataPointDto
                {
                    Label = months[m - 1],
                    Value = count
                });
            }
            
            return Ok(new ChartDataDto
            {
                Labels = result.Select(r => r.Label).ToArray(),
                Data = result.Select(r => r.Value).ToArray()
            });
        }

        // GET: api/analytics/users/stats
        [HttpGet("users/stats")]
        public async Task<ActionResult<UserAnalyticsDto>> GetUserStats()
        {
            var now = DateTime.UtcNow;
            var thirtyDaysAgo = now.AddDays(-30);
            var ninetyDaysAgo = now.AddDays(-90);

            var totalUsers = await _context.Users.CountAsync();
            var activeUsers = await _context.Orders
                .Where(o => o.CreatedAt >= ninetyDaysAgo)
                .Select(o => o.UserId)
                .Distinct()
                .CountAsync();
            var newUsersThisMonth = await _context.Users
                .CountAsync(u => u.CreatedAt >= thirtyDaysAgo);
            var usersWithOrders = await _context.Orders
                .Select(o => o.UserId)
                .Distinct()
                .CountAsync();

            // Отток - пользователи без заказов за последние 90 дней
            var churnedUsers = totalUsers - activeUsers;

            var stats = new UserAnalyticsDto
            {
                TotalUsers = totalUsers,
                ActiveUsers = activeUsers,
                NewUsersThisMonth = newUsersThisMonth,
                UsersWithOrders = usersWithOrders,
                ChurnedUsers = churnedUsers,
                ConversionRate = totalUsers > 0 ? (usersWithOrders / (double)totalUsers) * 100 : 0
            };

            return Ok(stats);
        }
    }

    // DTOs для аналитики
    public class DashboardDto
    {
        public int TotalProducts { get; set; }
        public int TotalOrders { get; set; }
        public int TotalUsers { get; set; }
        public decimal TotalRevenue { get; set; }
        public int MonthlyOrders { get; set; }
        public decimal MonthlyRevenue { get; set; }
        public int YearlyOrders { get; set; }
        public decimal YearlyRevenue { get; set; }
        public int NewUsersThisMonth { get; set; }
    }

    public class ChartDataDto
    {
        public string[] Labels { get; set; } = Array.Empty<string>();
        public decimal[] Data { get; set; } = Array.Empty<decimal>();
    }

    public class ChartDataPointDto
    {
        public string Label { get; set; } = string.Empty;
        public decimal Value { get; set; }
    }

    public class ProductAnalyticsDto
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string ProductArticle { get; set; } = string.Empty;
        public int TotalSold { get; set; }
        public decimal TotalRevenue { get; set; }
    }

    public class CategoryAnalyticsDto
    {
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public int TotalSold { get; set; }
        public decimal TotalRevenue { get; set; }
        public int OrderCount { get; set; }
    }

    public class ProductMarginDto
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string ProductArticle { get; set; } = string.Empty;
        public int UnitsSold { get; set; }
        public decimal Revenue { get; set; }
        public decimal Cost { get; set; }
        public decimal Profit { get; set; }
        public decimal MarginPercent { get; set; }
    }

    public class CategoryMarginDto
    {
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public int UnitsSold { get; set; }
        public decimal Revenue { get; set; }
        public decimal Cost { get; set; }
        public decimal Profit { get; set; }
        public decimal MarginPercent { get; set; }
        public int OrderCount { get; set; }
    }

    public class FinancialReportDto
    {
        public DateTime PeriodStart { get; set; }
        public DateTime PeriodEnd { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal TotalCost { get; set; }
        public decimal GrossProfit { get; set; }
        public decimal ProfitMargin { get; set; }
        public int TotalOrders { get; set; }
        public int TotalItemsSold { get; set; }
    }

    public class UserAnalyticsDto
    {
        public int TotalUsers { get; set; }
        public int ActiveUsers { get; set; }
        public int NewUsersThisMonth { get; set; }
        public int UsersWithOrders { get; set; }
        public int ChurnedUsers { get; set; }
        public double ConversionRate { get; set; }
    }
}
