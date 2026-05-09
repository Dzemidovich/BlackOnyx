using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Diplom.Models;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Diplom.Services;

namespace Diplom.Controllers
{
    [ApiController]
    [Authorize] // Added to ensure security after debugging
    [Route("api/[controller]")]
    public class CartController : ControllerBase
    {
        private readonly ToolShopDbContext _context;
        private readonly ILoyaltyService _loyaltyService;
        private readonly IDiscountCalculationService _discountCalculationService;

        public CartController(
            ToolShopDbContext context,
            ILoyaltyService loyaltyService,
            IDiscountCalculationService discountCalculationService)
        {
            _context = context;
            _loyaltyService = loyaltyService;
            _discountCalculationService = discountCalculationService;
        }

        // Вспомогательный метод для получения userId из токена
        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                return null;
            return userId;
        }

        // GET: api/cart (корзина текущего пользователя)
        [HttpGet]
        [Authorize(Roles = "Customer,Admin,Manager")]
        public async Task<ActionResult> GetMyCart()
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized("Требуется авторизация");

            return await GetCartForUser(userId.Value);
        }

        // GET: api/cart/user/{userId} (для Admin)
        [HttpGet("user/{userId}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> GetUserCart(int userId)
        {
            return await GetCartForUser(userId);
        }

        private async Task<ActionResult> GetCartForUser(int userId)
        {
            try
            {
                var cart = await _context.Carts
                    .Include(c => c.CartItems)
                    .ThenInclude(ci => ci.Product)
                    .FirstOrDefaultAsync(c => c.UserId == userId);

                if (cart == null)
                {
                    return Ok(new
                    {
                        message = "Корзина пуста",
                        items = new List<object>(),
                        totalItems = 0,
                        totalAmount = 0,
                        discount = 0,
                        discountAmount = 0,
                        finalAmount = 0
                    });
                }

                // Получить текущую скидку пользователя
                var user = await _context.Users.FindAsync(userId);
                var currentDiscount = user?.CurrentDiscount ?? 0;

                var items = cart.CartItems.Select(ci => new
                {
                    ci.Id,
                    ci.ProductId,
                    ProductName = ci.Product.Name,
                    ProductArticle = ci.Product.Article,
                    ImageUrl = ci.Product.ImageUrl,
                    Price = ci.Price,
                    ci.Quantity,
                    Total = ci.Price * ci.Quantity,
                    Stock = ci.Product.Stock
                }).ToList();

                var totalAmount = items.Sum(i => i.Total);
                var discountAmount = _discountCalculationService.CalculateDiscountAmount(totalAmount, currentDiscount);
                var finalAmount = totalAmount - discountAmount;

                return Ok(new
                {
                    cart.Id,
                    cart.UserId,
                    items,
                    totalItems = items.Sum(i => i.Quantity),
                    totalAmount,
                    discount = currentDiscount,
                    discountAmount,
                    finalAmount,
                    cart.CreatedAt
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // POST: api/cart/add
        [HttpPost("add")]
        [Authorize(Roles = "Customer")]
        public async Task<ActionResult> AddToCart([FromBody] AddToCartDto model)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized("Требуется авторизация");

            try
            {
                // Проверка товара
                var product = await _context.Products.FindAsync(model.ProductId);
                if (product == null)
                    return NotFound(new { error = "Товар не найден" });

                if (product.Stock < model.Quantity)
                    return BadRequest(new { error = $"Недостаточно товара на складе. Доступно: {product.Stock} шт.", available = product.Stock });

                // Поиск или создание корзины
                var cart = await _context.Carts
                    .Include(c => c.CartItems)
                    .FirstOrDefaultAsync(c => c.UserId == userId);

                if (cart == null)
                {
                    cart = new Cart
                    {
                        UserId = userId.Value,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.Carts.Add(cart);
                    await _context.SaveChangesAsync();
                }

                // Проверка наличия товара в корзине
                var existingItem = cart.CartItems.FirstOrDefault(ci => ci.ProductId == model.ProductId);

                if (existingItem != null)
                {
                    // Проверяем суммарное количество с учётом уже добавленного
                    var totalQuantity = existingItem.Quantity + model.Quantity;
                    if (totalQuantity > product.Stock)
                    {
                        var canAdd = product.Stock - existingItem.Quantity;
                        if (canAdd <= 0)
                            return BadRequest(new { error = $"Товар уже добавлен в корзину в максимальном количестве ({product.Stock} шт.)", available = 0 });
                        return BadRequest(new { error = $"Можно добавить ещё только {canAdd} шт. (на складе {product.Stock} шт.)", available = canAdd });
                    }
                    existingItem.Quantity = totalQuantity;
                }
                else
                {
                    var cartItem = new CartItem
                    {
                        CartId = cart.Id,
                        ProductId = model.ProductId,
                        Quantity = model.Quantity,
                        Price = product.Price // Используем базовую цену товара
                    };
                    _context.CartItems.Add(cartItem);
                }

                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Товар добавлен в корзину" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // PUT: api/cart/update/5
        [HttpPut("update/{itemId}")]
        [Authorize(Roles = "Customer")]
        public async Task<ActionResult> UpdateCartItem(int itemId, [FromBody] UpdateCartItemModel model)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized("Требуется авторизация");

            try
            {
                var cartItem = await _context.CartItems
                    .Include(ci => ci.Product)
                    .Include(ci => ci.Cart)
                    .FirstOrDefaultAsync(ci => ci.Id == itemId);

                if (cartItem == null)
                    return NotFound(new { error = "Товар в корзине не найден" });

                // Проверка владельца корзины
                if (cartItem.Cart.UserId != userId)
                    return Forbid();

                if (cartItem.Product.Stock < model.Quantity)
                    return BadRequest(new { error = $"Недостаточно товара на складе. Доступно: {cartItem.Product.Stock} шт.", available = cartItem.Product.Stock });

                if (model.Quantity <= 0)
                {
                    _context.CartItems.Remove(cartItem);
                }
                else
                {
                    cartItem.Quantity = model.Quantity;
                }

                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Корзина обновлена" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // DELETE: api/cart/remove/5
        [HttpDelete("remove/{itemId}")]
        [Authorize(Roles = "Customer")]
        public async Task<ActionResult> RemoveFromCart(int itemId)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized("Требуется авторизация");

            try
            {
                var cartItem = await _context.CartItems
                    .Include(ci => ci.Cart)
                    .FirstOrDefaultAsync(ci => ci.Id == itemId);
                
                if (cartItem == null)
                    return NotFound(new { error = "Товар не найден в корзине" });

                // Проверка владельца корзины
                if (cartItem.Cart.UserId != userId)
                    return Forbid();

                _context.CartItems.Remove(cartItem);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Товар удален из корзины" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // POST: api/cart/checkout
        [HttpPost("checkout")]
        [Authorize(Roles = "Customer")]
        public async Task<ActionResult> Checkout([FromBody] CheckoutRequest? request)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized("Требуется авторизация");

            try
            {
                var cart = await _context.Carts
                    .Include(c => c.CartItems)
                    .ThenInclude(ci => ci.Product)
                    .FirstOrDefaultAsync(c => c.UserId == userId);

                if (cart == null || !cart.CartItems.Any())
                    return BadRequest(new { error = "Корзина пуста" });

                // Проверка наличия товаров
                foreach (var item in cart.CartItems)
                {
                    if (item.Product.Stock < item.Quantity)
                    {
                        return BadRequest(new
                        {
                            error = $"Недостаточно товара: {item.Product.Name}",
                            productId = item.ProductId,
                            available = item.Product.Stock
                        });
                    }
                }

                // Получить текущую скидку пользователя
                var user = await _context.Users.FindAsync(userId.Value);
                var currentDiscount = user?.CurrentDiscount ?? 0;

                // Рассчитать сумму заказа
                var totalAmount = cart.CartItems.Sum(ci => ci.Price * ci.Quantity);
                
                // Применить скидку
                var discountAmount = _discountCalculationService.CalculateDiscountAmount(totalAmount, currentDiscount);
                var finalAmount = totalAmount - discountAmount;

                // Создание заказа
                var order = new Order
                {
                    UserId = userId.Value,
                    TotalAmount = finalAmount,
                    Status = "Новый",
                    CreatedAt = DateTime.UtcNow,
                    Comment = request?.Comment,
                    AppliedDiscount = currentDiscount,
                    DiscountAmount = discountAmount
                };

                _context.Orders.Add(order);
                await _context.SaveChangesAsync(); // Сохраняем, чтобы получить Id заказа

                // Создание OrderItems для каждого товара в корзине
                foreach (var cartItem in cart.CartItems)
                {
                    var orderItem = new OrderItem
                    {
                        OrderId = order.Id,
                        ProductId = cartItem.ProductId,
                        Quantity = cartItem.Quantity,
                        Price = cartItem.Price,
                        Total = cartItem.Price * cartItem.Quantity
                    };
                    _context.OrderItems.Add(orderItem);
                }

                // Обновление остатков
                foreach (var item in cart.CartItems)
                {
                    item.Product.Stock -= item.Quantity;
                }

                // Очистка корзины
                _context.CartItems.RemoveRange(cart.CartItems);

                // Уведомление
                var notificationMessage = currentDiscount > 0
                    ? $"Заказ #{order.Id} на сумму {finalAmount:F2} BYN (скидка {currentDiscount}%: -{discountAmount:F2} BYN) успешно оформлен."
                    : $"Заказ #{order.Id} на сумму {finalAmount:F2} BYN успешно оформлен.";

                var notification = new Notification
                {
                    UserId = userId.Value,
                    Title = "Заказ оформлен",
                    Message = notificationMessage,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Notifications.Add(notification);

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    orderId = order.Id,
                    total = finalAmount,
                    discount = currentDiscount,
                    discountAmount = discountAmount,
                    message = $"Заказ #{order.Id} успешно оформлен"
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // GET: api/cart/count
        [HttpGet("count")]
        [Authorize(Roles = "Customer,Admin,Manager")]
        public async Task<ActionResult> GetCartCount()
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized("Требуется авторизация");

            try
            {
                var cart = await _context.Carts
                    .Include(c => c.CartItems)
                    .FirstOrDefaultAsync(c => c.UserId == userId);

                var count = cart?.CartItems.Sum(ci => ci.Quantity) ?? 0;

                return Ok(new { count });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
    }

    // Модели для запросов
    public class AddToCartDto
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; } = 1;
    }

    public class UpdateCartItemModel
    {
        public int Quantity { get; set; }
    }

    public class CheckoutRequest
    {
        public string? Comment { get; set; }
    }
}
