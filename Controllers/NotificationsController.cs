using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Diplom.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace Diplom.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly ToolShopDbContext _context;

        public NotificationsController(ToolShopDbContext context)
        {
            _context = context;
        }

        // GET: api/notifications
        [HttpGet]
        public async Task<ActionResult<IEnumerable<NotificationDto>>> GetUserNotifications()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("Требуется авторизация");
            }

            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => new NotificationDto
                {
                    Id = n.Id,
                    Title = n.Title,
                    Message = n.Message,
                    Type = n.Type,
                    IsRead = n.IsRead ?? false,
                    CreatedAt = n.CreatedAt
                })
                .ToListAsync();

            return Ok(notifications);
        }

        // GET: api/notifications/unread-count
        [HttpGet("unread-count")]
        public async Task<ActionResult<int>> GetUnreadCount()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("Требуется авторизация");
            }

            var count = await _context.Notifications
                .Where(n => n.UserId == userId && (n.IsRead == null || n.IsRead == false))
                .CountAsync();

            return Ok(count);
        }

        // PUT: api/notifications/{id}/read
        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("Требуется авторизация");
            }

            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

            if (notification == null)
            {
                return NotFound("Уведомление не найдено");
            }

            notification.IsRead = true;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/notifications/send
        [HttpPost("send")]
        public async Task<IActionResult> SendNotification([FromBody] SendNotificationRequest request)
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (userRole != "Admin")
            {
                return Forbid("Только администраторы могут отправлять уведомления");
            }

            if (request.UserId.HasValue)
            {
                // Отправить конкретному пользователю
                var user = await _context.Users.FindAsync(request.UserId.Value);
                if (user == null)
                {
                    return NotFound("Пользователь не найден");
                }

                var notification = new Notification
                {
                    UserId = request.UserId.Value,
                    Title = request.Title,
                    Message = request.Message,
                    Type = request.Type ?? "system",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Notifications.Add(notification);
            }
            else
            {
                // Отправить всем пользователям
                var users = await _context.Users.Where(u => u.IsActive == true).ToListAsync();

                foreach (var user in users)
                {
                    var notification = new Notification
                    {
                        UserId = user.Id,
                        Title = request.Title,
                        Message = request.Message,
                        Type = request.Type ?? "system",
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.Notifications.Add(notification);
                }
            }

            await _context.SaveChangesAsync();

            return Ok("Уведомление отправлено");
        }
    }

    // DTOs
    public class NotificationDto
    {
        public int Id { get; set; }
        public string? Title { get; set; }
        public string? Message { get; set; }
        public string? Type { get; set; }
        public bool IsRead { get; set; }
        public DateTime? CreatedAt { get; set; }
    }

    public class SendNotificationRequest
    {
        public int? UserId { get; set; } // null - отправить всем
        public string? Title { get; set; }
        public string? Message { get; set; }
        public string? Type { get; set; } // system, order, marketing, etc.
    }
}
