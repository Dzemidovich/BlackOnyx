using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Diplom.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Security.Claims;

namespace Diplom.Controllers
{
    [ApiController]
    [Route("api/admin-notifications")]
    public class AdminNotificationsController : ControllerBase
    {
        private readonly ToolShopDbContext _context;

        public AdminNotificationsController(ToolShopDbContext context)
        {
            _context = context;
        }

        // POST: api/admin-notifications/send
        [HttpPost("send")]
        public async Task<IActionResult> SendNotification([FromBody] SendNotificationDto request)
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (userRole != "Admin")
            {
                return Forbid("Только администраторы могут отправлять уведомления");
            }

            if (string.IsNullOrEmpty(request.Title) || string.IsNullOrEmpty(request.Message))
            {
                return BadRequest("Заголовок и сообщение обязательны");
            }

            var sentCount = 0;

            if (request.UserId.HasValue)
            {
                // Send to specific user
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
                sentCount = 1;
            }
            else
            {
                // Send to all active users
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
                    sentCount++;
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = $"Уведомление отправлено {sentCount} пользователям", sentCount });
        }
    }

    public class SendNotificationDto
    {
        public int? UserId { get; set; } // null - отправить всем активным пользователям
        public string? Title { get; set; }
        public string? Message { get; set; }
        public string? Type { get; set; } // system, order, marketing, etc.
    }
}
