using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Diplom.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Text;
using System.IO;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace Diplom.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin,Manager")]
    public class SystemToolsController : ControllerBase
    {
        private readonly ToolShopDbContext _context;

        public SystemToolsController(ToolShopDbContext context)
        {
            _context = context;
        }

        // Export Products to CSV
        [HttpGet("export/products")]
        public async Task<IActionResult> ExportProducts(bool includeInactive = false)
        {
            var products = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.ProductAttributes)
                .Where(p => includeInactive || p.IsActive == true)
                .OrderBy(p => p.Name)
                .ToListAsync();

            var csv = new StringBuilder();
            csv.AppendLine("Артикул,Название,Описание,Цена,Количество,Категория,Активен,Изображение");

            foreach (var product in products)
            {
                var categoryName = product.Category?.Name ?? "Без категории";
                var description = product.Description?.Replace(",", ";").Replace("\n", " ").Replace("\r", "") ?? "";
                var imageUrl = product.ImageUrl ?? "";

                csv.AppendLine($"\"{product.Article}\",\"{product.Name}\",\"{description}\",\"{product.Price}\",\"{product.Stock}\",\"{categoryName}\",\"{product.IsActive}\",\"{imageUrl}\"");
            }

            var fileName = $"products_export_{DateTime.UtcNow:yyyy-MM-dd_HH-mm-ss}.csv";
            return File(Encoding.UTF8.GetBytes(csv.ToString()), "text/csv", fileName);
        }

        // Export Orders to CSV
        [HttpGet("export/orders")]
        public async Task<IActionResult> ExportOrders(string? status = null, DateTime? startDate = null, DateTime? endDate = null)
        {
            var query = _context.Orders
                .Include(o => o.User)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(o => o.Status == status);
            }

            if (startDate.HasValue)
            {
                query = query.Where(o => o.CreatedAt >= startDate.Value.Date);
            }

            if (endDate.HasValue)
            {
                query = query.Where(o => o.CreatedAt <= endDate.Value.Date.AddDays(1));
            }

            var orders = await query
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();

            var csv = new StringBuilder();
            csv.AppendLine("ID_заказа,Пользователь,Email,Сумма,Статус,Дата_создания");

            foreach (var order in orders)
            {
                csv.AppendLine($"\"{order.Id}\",\"{order.User?.FullName ?? "Не указан"}\",\"{order.User?.Email ?? ""}\",\"{order.TotalAmount ?? 0}\",\"{order.Status ?? "Новый"}\",\"{order.CreatedAt?.ToString("yyyy-MM-dd HH:mm:ss") ?? ""}\"");
            }

            var fileName = $"orders_export_{DateTime.UtcNow:yyyy-MM-dd_HH-mm-ss}.csv";
            return File(Encoding.UTF8.GetBytes(csv.ToString()), "text/csv", fileName);
        }

        // Export Users to CSV
        [HttpGet("export/users")]
        public async Task<IActionResult> ExportUsers(bool includeInactive = false)
        {
            var users = await _context.Users
                .Where(u => includeInactive || (u.IsActive ?? true))
                .OrderBy(u => u.FullName)
                .ThenBy(u => u.Email)
                .ToListAsync();

            var csv = new StringBuilder();
            csv.AppendLine("ID,Email,Имя,Роль,Активен,Дата_регистрации");

            foreach (var user in users)
            {
                csv.AppendLine($"\"{user.Id}\",\"{user.Email}\",\"{user.FullName ?? ""}\",\"{user.Role}\",\"{user.IsActive ?? true}\",\"{user.CreatedAt?.ToString("yyyy-MM-dd HH:mm:ss") ?? ""}\"");
            }

            var fileName = $"users_export_{DateTime.UtcNow:yyyy-MM-dd_HH-mm-ss}.csv";
            return File(Encoding.UTF8.GetBytes(csv.ToString()), "text/csv", fileName);
        }

        // Import Products from CSV
        [HttpPost("import/products")]
        public async Task<IActionResult> ImportProducts(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("Файл не выбран или пустой");
            }

            if (!file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest("Только CSV файлы поддерживаются");
            }

            var imported = 0;
            var updated = 0;
            var errors = new List<string>();

            try
            {
                using (var reader = new StreamReader(file.OpenReadStream(), Encoding.UTF8, detectEncodingFromByteOrderMarks: true))
                {
                    // Skip header
                    var headerLine = await reader.ReadLineAsync();
                    if (headerLine == null)
                    {
                        return BadRequest("Файл пустой или не содержит данных");
                    }

                    string line;
                    var lineNumber = 2;

                    while ((line = await reader.ReadLineAsync()) != null)
                    {
                        // Skip empty lines
                        if (string.IsNullOrWhiteSpace(line))
                        {
                            lineNumber++;
                            continue;
                        }

                        try
                        {
                            var fields = ParseCsvLine(line.Trim());
                            if (fields.Length < 3)
                            {
                                errors.Add($"Строка {lineNumber}: недостаточно полей данных (найдено {fields.Length}, нужно минимум 3)");
                                lineNumber++;
                                continue;
                            }

                            // CSV format: name;vendor_code;price_prepaid;warehouse_main;description;media_img
                            var article = fields[1].Trim();  // vendor_code
                            var name = fields[0].Trim();    // name
                            var description = fields[4].Trim();  // description
                            var priceText = fields[2].Trim();  // price_prepaid
                            var stockText = fields[3].Trim();  // warehouse_main
                            var imageUrl = fields.Length > 5 ? fields[5].Trim() : "";  // media_img
                            var categoryName = "";  // Нет категории в CSV

                            // Validate required fields
                            if (string.IsNullOrEmpty(article) || string.IsNullOrEmpty(name))
                            {
                                errors.Add($"Строка {lineNumber}: артикул='{article}', название='{name}' - оба поля обязательны");
                                lineNumber++;
                                continue;
                            }

                            // Parse price (заменяем запятую на точку)
                            var priceNormalized = priceText.Replace(',', '.');
                            if (!decimal.TryParse(priceNormalized, out var price) || price < 0)
                            {
                                errors.Add($"Строка {lineNumber}: некорректная цена '{priceText}'");
                                lineNumber++;
                                continue;
                            }

                            // Parse stock (может быть "10 дней" или число)
                            var stockNormalized = stockText.Replace(" дней", "").Replace("дней", "").Trim();
                            if (!int.TryParse(stockNormalized, out var stock) || stock < 0)
                            {
                                // Если не число - считаем что есть в наличии
                                stock = stockText.Contains("день") ? 100 : 0;
                            }

                            // Find or create category
                            Category? category = null;
                            if (!string.IsNullOrEmpty(categoryName))
                            {
                                category = await _context.Categories.FirstOrDefaultAsync(c => c.Name == categoryName);
                                if (category == null)
                                {
                                    category = new Category { Name = categoryName };
                                    _context.Categories.Add(category);
                                }
                            }

                            // Check if product already exists
                            var existingProduct = await _context.Products.FirstOrDefaultAsync(p => p.Article == article);
                            if (existingProduct != null)
                            {
                                // Update existing product
                                var oldPrice = existingProduct.Price;
                                var oldStock = existingProduct.Stock;

                                existingProduct.Name = name;
                                existingProduct.Description = string.IsNullOrEmpty(description) ? null : description;
                                existingProduct.Price = price;
                                existingProduct.Stock = stock;
                                existingProduct.CategoryId = category?.Id;
                                existingProduct.ImageUrl = string.IsNullOrEmpty(imageUrl) ? existingProduct.ImageUrl : imageUrl;

                                updated++;
                            }
                            else
                            {
                                // Create new product
                                var product = new Product
                                {
                                    Article = article,
                                    Name = name,
                                    Description = string.IsNullOrEmpty(description) ? null : description,
                                    Price = price,
                                    Stock = stock,
                                    CategoryId = category?.Id,
                                    ImageUrl = string.IsNullOrEmpty(imageUrl) ? null : imageUrl,
                                    IsActive = true,
                                    CreatedAt = DateTime.UtcNow
                                };

                                _context.Products.Add(product);
                                imported++;
                            }
                        }
                        catch (Exception ex)
                        {
                            errors.Add($"Строка {lineNumber}: ошибка обработки - {ex.Message}");
                        }

                        lineNumber++;
                    }
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    imported = imported,
                    updated = updated,
                    errors = errors,
                    message = $"Импорт завершен. Создано: {imported} товаров, обновлено: {updated} товаров. Ошибок: {errors.Count}"
                });
            }
            catch (Exception ex)
            {
                return BadRequest($"Ошибка при обработке файла: {ex.Message}");
            }
        }

        [HttpPost("cleanup")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CleanupSystem([FromBody] CleanupRequest request)
        {
            var result = new CleanupResult();

            try
            {
                // Clean old notifications
                if (request.CleanNotifications)
                {
                    var oldNotifications = await _context.Notifications
                        .Where(n => n.CreatedAt < DateTime.UtcNow.AddDays(-request.NotificationsDays))
                        .ToListAsync();

                    _context.Notifications.RemoveRange(oldNotifications);
                    result.DeletedNotifications = oldNotifications.Count;
                }

                // Clean old orders (only cancelled ones)
                if (request.CleanCancelledOrders)
                {
                    var oldCancelledOrders = await _context.Orders
                        .Where(o => o.Status == "Отменен" && o.CreatedAt < DateTime.UtcNow.AddDays(-request.OrdersDays))
                        .ToListAsync();

                    _context.Orders.RemoveRange(oldCancelledOrders);
                    result.DeletedOrders = oldCancelledOrders.Count;
                }

                // Clean inactive users
                if (request.CleanInactiveUsers)
                {
                    var inactiveUsers = await _context.Users
                        .Where(u => (u.IsActive == false || u.IsActive == null) &&
                                   u.CreatedAt < DateTime.UtcNow.AddDays(-request.UsersDays))
                        .ToListAsync();

                    // Don't delete users with orders
                    var usersWithOrders = await _context.Orders
                        .Where(o => inactiveUsers.Select(u => u.Id).Contains(o.UserId))
                        .Select(o => o.UserId)
                        .Distinct()
                        .ToListAsync();

                    var usersToDelete = inactiveUsers.Where(u => !usersWithOrders.Contains(u.Id)).ToList();
                    _context.Users.RemoveRange(usersToDelete);
                    result.DeletedUsers = usersToDelete.Count;
                }

                await _context.SaveChangesAsync();

                result.Success = true;
                result.Message = "Очистка системы выполнена успешно";

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest($"Ошибка при очистке: {ex.Message}");
            }
        }



        // Get system stats
        [HttpGet("stats")]
        public async Task<IActionResult> GetSystemStats()
        {
            var stats = new
            {
                products = await _context.Products.CountAsync(),
                activeProducts = await _context.Products.CountAsync(p => p.IsActive == true),
                orders = await _context.Orders.CountAsync(),
                users = await _context.Users.CountAsync(),
                activeUsers = await _context.Users.CountAsync(u => u.IsActive == true || u.IsActive == null),
                categories = await _context.Categories.CountAsync(),
                notifications = await _context.Notifications.CountAsync(),
                databaseSize = "Не определено", // Would need additional query for actual size
                lastBackup = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss") // Placeholder
            };

            return Ok(stats);
        }

        // Helper method to parse CSV line (handles quoted fields)
        private string[] ParseCsvLine(string line)
        {
            var result = new List<string>();
            var current = new StringBuilder();
            var inQuotes = false;

            for (int i = 0; i < line.Length; i++)
            {
                char c = line[i];

                if (c == '"')
                {
                    if (inQuotes && i + 1 < line.Length && line[i + 1] == '"')
                    {
                        // Escaped quote
                        current.Append('"');
                        i++; // Skip next quote
                    }
                    else
                    {
                        // Toggle quote state
                        inQuotes = !inQuotes;
                    }
                }
                else if (c == ',' && !inQuotes)
                {
                    // Field separator
                    result.Add(current.ToString());
                    current.Clear();
                }
                else
                {
                    current.Append(c);
                }
            }

            // Add last field
            result.Add(current.ToString());

            return result.ToArray();
        }
    }

    // DTOs
    public class CleanupRequest
    {
        public bool CleanNotifications { get; set; }
        public int NotificationsDays { get; set; } = 30;
        public bool CleanCancelledOrders { get; set; }
        public int OrdersDays { get; set; } = 90;
        public bool CleanInactiveUsers { get; set; }
        public int UsersDays { get; set; } = 365;
    }

    public class CleanupResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public int DeletedNotifications { get; set; }
        public int DeletedOrders { get; set; }
        public int DeletedUsers { get; set; }
    }


}
