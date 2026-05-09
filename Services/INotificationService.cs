namespace Diplom.Services;

public interface INotificationService
{
    Task CreateNotificationAsync(int userId, string title, string message, string type);
}
