using Diplom.Models;
using Microsoft.EntityFrameworkCore;

namespace Diplom.Services;

public class NotificationService : INotificationService
{
    private readonly ToolShopDbContext _context;

    public NotificationService(ToolShopDbContext context)
    {
        _context = context;
    }

    public async Task CreateNotificationAsync(int userId, string title, string message, string type)
    {
        var notification = new Notification
        {
            UserId = userId,
            Title = title,
            Message = message,
            Type = type,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();
    }
}
