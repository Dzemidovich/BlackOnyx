using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Diplom.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Diplom.Services;

namespace Diplom.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class OrdersController : ControllerBase
    {
        private readonly ToolShopDbContext _context;
        private readonly ILoyaltyService _loyaltyService;

        public OrdersController(ToolShopDbContext context, ILoyaltyService loyaltyService)
        {
            _context = context;
            _loyaltyService = loyaltyService;
        }

        // Получить мои заказы (для Customer)
        [HttpGet("my")]
        public async Task<ActionResult<IEnumerable<object>>> GetMyOrders()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("Требуется авторизация");
            }

            var orders = await _context.Orders
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
                .Where(o => o.UserId == userId)
                .OrderByDescending(o => o.CreatedAt)
                .Select(o => new
                {
                    o.Id,
                    o.UserId,
                    o.TotalAmount,
                    o.Status,
                    o.CreatedAt,
                    Items = o.OrderItems.Select(oi => new
                    {
                        oi.ProductId,
                        ProductName = oi.Product.Name,
                        ProductArticle = oi.Product.Article,
                        ImageUrl = oi.Product.ImageUrl,
                        oi.Quantity,
                        oi.Price,
                        oi.Total
                    }).ToList()
                })
                .ToListAsync();

            return Ok(orders);
        }

        // Получить заказы конкретного пользователя (для Admin/Manager)
        [HttpGet("user/{userId}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<IEnumerable<Order>>> GetUserOrders(int userId)
        {
            return await _context.Orders
                .Include(o => o.OrderItems)
                .Where(o => o.UserId == userId)
                .ToListAsync();
        }

        // Admin methods
        [HttpGet("admin/all")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<IEnumerable<AdminOrderDto>>> GetAllOrders(string? status = null, string? sortBy = "created", string? sortDirection = "desc")
        {
            var query = _context.Orders
                .Include(o => o.User)
                .Include(o => o.OrderItems)
                .AsQueryable();

            // Filter by status
            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(o => o.Status == status);
            }

            // Apply sorting
            query = sortBy?.ToLower() switch
            {
                "totalamount" => sortDirection?.ToLower() == "asc"
                    ? query.OrderBy(o => o.TotalAmount)
                    : query.OrderByDescending(o => o.TotalAmount),
                "status" => sortDirection?.ToLower() == "asc"
                    ? query.OrderBy(o => o.Status)
                    : query.OrderByDescending(o => o.Status),
                _ => sortDirection?.ToLower() == "asc"
                    ? query.OrderBy(o => o.CreatedAt)
                    : query.OrderByDescending(o => o.CreatedAt)
            };

            var orders = await query
                .Select(o => new AdminOrderDto
                {
                    Id = o.Id,
                    UserId = o.UserId,
                    UserEmail = o.User.Email,
                    UserFullName = o.User.FullName,
                    TotalAmount = o.TotalAmount ?? 0,
                    Status = o.Status ?? "Новый",
                    CreatedAt = o.CreatedAt,
                    ItemsCount = _context.OrderItems
                        .Where(oi => oi.OrderId == o.Id)
                        .Sum(oi => oi.Quantity)
                })
                .ToListAsync();

            return Ok(orders);
        }

        [HttpPut("{id}/status")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] UpdateOrderStatusDto statusDto)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order == null)
            {
                return NotFound();
            }

            // Получаем статус
            var statusValue = statusDto.Status;
            
            if (string.IsNullOrEmpty(statusValue))
            {
                return BadRequest(new { message = "Статус не указан" });
            }

            // Нормализуем статус (конвертируем английский в русский)
            statusValue = statusValue switch
            {
                "New" => "Новый",
                "Processing" => "В обработке",
                "Shipped" => "Отгружен",
                "Completed" => "Завершен",
                "Cancelled" => "Отменен",
                _ => statusValue // Оставляем как есть, если уже на русском
            };

            // Validate status
            var validStatuses = new[] { "Новый", "В обработке", "Отгружен", "Завершен", "Отменен" };
            if (!validStatuses.Contains(statusValue))
            {
                return BadRequest(new { message = $"Некорректный статус заказа: {statusValue}" });
            }

            var oldStatus = order.Status;
            order.Status = statusValue;

            // Обновить TotalOrdersAmount при завершении заказа
            if (statusValue == "Завершен" && oldStatus != "Завершен")
            {
                await _loyaltyService.UpdateTotalOrdersAmountAsync(order.UserId, order.TotalAmount ?? 0, isAddition: true);
            }

            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Статус заказа обновлен", newStatus = statusValue });
        }

        // POST: api/orders/{id}/cancel (для клиента - отмена своего заказа)
        [HttpPost("{id}/cancel")]
        public async Task<IActionResult> CancelOrder(int id)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("Требуется авторизация");
            }

            var order = await _context.Orders.FindAsync(id);
            if (order == null)
            {
                return NotFound("Заказ не найден");
            }

            // Проверка владельца заказа
            if (order.UserId != userId)
            {
                return Forbid();
            }

            // Можно отменить только заказы в статусе "Новый"
            if (order.Status != "Новый")
            {
                return BadRequest(new { error = "Можно отменить только заказы в статусе 'Новый'" });
            }

            var oldStatus = order.Status;
            order.Status = "Отменен";

            // Если заказ был завершен ранее, уменьшить TotalOrdersAmount
            // (в текущей логике заказы отменяются только в статусе "Новый", но добавим проверку на будущее)
            if (oldStatus == "Завершен")
            {
                await _loyaltyService.UpdateTotalOrdersAmountAsync(order.UserId, order.TotalAmount ?? 0, isAddition: false);
            }

            // Уведомление
            var notification = new Notification
            {
                UserId = userId,
                Title = "Заказ отменён",
                Message = $"Заказ #{order.Id} был отменён.",
                CreatedAt = DateTime.UtcNow
            };
            _context.Notifications.Add(notification);

            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = $"Заказ #{id} отменён" });
        }

        // POST: api/orders/{id}/repeat (для клиента - повторить заказ, добавить товары в корзину)
        [HttpPost("{id}/repeat")]
        public async Task<IActionResult> RepeatOrder(int id)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("Требуется авторизация");
            }

            var order = await _context.Orders
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null)
            {
                return NotFound("Заказ не найден");
            }

            if (order.UserId != userId)
            {
                return Forbid();
            }

            // Найти или создать корзину пользователя
            var cart = await _context.Carts
                .Include(c => c.CartItems)
                .ThenInclude(ci => ci.Product)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart == null)
            {
                cart = new Cart
                {
                    UserId = userId,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Carts.Add(cart);
                await _context.SaveChangesAsync();
            }

            int addedItems = 0;

            foreach (var orderItem in order.OrderItems)
            {
                var product = await _context.Products.FindAsync(orderItem.ProductId);
                if (product == null || product.Stock <= 0)
                {
                    continue;
                }

                // Не добавляем больше, чем есть на складе
                var qtyToAdd = Math.Min(orderItem.Quantity, product.Stock);
                if (qtyToAdd <= 0) continue;

                var existingItem = cart.CartItems.FirstOrDefault(ci => ci.ProductId == orderItem.ProductId);
                if (existingItem != null)
                {
                    existingItem.Quantity += qtyToAdd;
                }
                else
                {
                    var cartItem = new CartItem
                    {
                        CartId = cart.Id,
                        ProductId = orderItem.ProductId,
                        Quantity = qtyToAdd,
                        Price = product.Price
                    };
                    _context.CartItems.Add(cartItem);
                }

                addedItems += qtyToAdd;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = addedItems > 0
                    ? $"Товары из заказа #{id} добавлены в корзину"
                    : "Не удалось добавить товары в корзину (возможно, их нет на складе)"
            });
        }

        [HttpGet("{id}/details")]
        public async Task<ActionResult<OrderDetailsDto>> GetOrderDetails(int id)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            int.TryParse(userIdClaim, out var currentUserId);

            var order = await _context.Orders
                .Include(o => o.User)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null)
            {
                return NotFound();
            }

            // Проверка прав: Admin/Manager или владелец заказа
            if (userRole != "Admin" && userRole != "Manager" && order.UserId != currentUserId)
            {
                // Логируем попытку несанкционированного доступа
                Diplom.Services.SecurityLogger.LogUnauthorizedAccess(
                    $"GET /api/orders/{id}/details", 
                    currentUserId.ToString(), 
                    HttpContext.Connection.RemoteIpAddress?.ToString()
                );
                return Forbid();
            }

            // Get order items from OrderItems table
            var orderItems = await _context.OrderItems
                .Include(oi => oi.Product)
                .Where(oi => oi.OrderId == order.Id)
                .Select(oi => new OrderItemDto
                {
                    ProductId = oi.ProductId,
                    ProductName = oi.Product.Name,
                    ProductArticle = oi.Product.Article,
                    ImageUrl = oi.Product.ImageUrl,
                    Quantity = oi.Quantity,
                    Price = oi.Price,
                    Total = oi.Total
                })
                .ToListAsync();

            var orderDetails = new OrderDetailsDto
            {
                Id = order.Id,
                UserId = order.UserId,
                UserEmail = order.User.Email,
                UserFullName = order.User.FullName,
                TotalAmount = order.TotalAmount ?? 0,
                Status = order.Status ?? "Новый",
                CreatedAt = order.CreatedAt,
                Comment = order.Comment,
                
                // Данные клиента
                IsLegalEntity = order.User.IsLegalEntity,
                CompanyName = order.User.CompanyName,
                Unp = order.User.Unp,
                LegalAddress = order.User.LegalAddress,
                ActualAddress = order.User.ActualAddress,
                BankName = order.User.BankName,
                BankCode = order.User.BankCode,
                CheckingAccount = order.User.CheckingAccount,
                DirectorName = order.User.DirectorName,
                ContactPhone = order.User.ContactPhone,
                ContactPerson = order.User.ContactPerson,
                
                Items = orderItems
            };

            return Ok(orderDetails);
        }

        [HttpGet("admin/stats")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<OrderStatsDto>> GetOrderStats()
        {
            var orders = await _context.Orders.ToListAsync();

            var stats = new OrderStatsDto
            {
                TotalOrders = orders.Count,
                NewOrders = orders.Count(o => o.Status == "Новый"),
                ProcessingOrders = orders.Count(o => o.Status == "В обработке"),
                ShippedOrders = orders.Count(o => o.Status == "Отгружен"),
                CompletedOrders = orders.Count(o => o.Status == "Завершен"),
                CancelledOrders = orders.Count(o => o.Status == "Отменен"),
                TotalRevenue = orders.Where(o => o.Status == "Завершен").Sum(o => o.TotalAmount ?? 0),
                AverageOrderValue = orders.Any() ? orders.Average(o => o.TotalAmount ?? 0) : 0
            };

            return Ok(stats);
        }
    }

    // DTOs for admin
    public class AdminOrderDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string UserEmail { get; set; } = string.Empty;
        public string? UserFullName { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime? CreatedAt { get; set; }
        public int ItemsCount { get; set; }
    }

    public class OrderDetailsDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string UserEmail { get; set; } = string.Empty;
        public string? UserFullName { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime? CreatedAt { get; set; }
        public string? Comment { get; set; }
        
        // Данные клиента (для админа)
        public bool IsLegalEntity { get; set; }
        public string? CompanyName { get; set; }
        public string? Unp { get; set; }
        public string? LegalAddress { get; set; }
        public string? ActualAddress { get; set; }
        public string? BankName { get; set; }
        public string? BankCode { get; set; }
        public string? CheckingAccount { get; set; }
        public string? DirectorName { get; set; }
        public string? ContactPhone { get; set; }
        public string? ContactPerson { get; set; }
        
        public List<OrderItemDto> Items { get; set; } = new();
    }

    public class OrderItemDto
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string ProductArticle { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public int Quantity { get; set; }
        public decimal Price { get; set; }
        public decimal Total { get; set; }
    }

    public class UpdateOrderStatusDto
    {
        public string? Status { get; set; }
    }

    public class OrderStatsDto
    {
        public int TotalOrders { get; set; }
        public int NewOrders { get; set; }
        public int ProcessingOrders { get; set; }
        public int ShippedOrders { get; set; }
        public int CompletedOrders { get; set; }
        public int CancelledOrders { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal AverageOrderValue { get; set; }
    }
}
