using Diplom.DTOs;
using Diplom.Models;
using Microsoft.EntityFrameworkCore;

namespace Diplom.Services;

public class LoyaltyService : ILoyaltyService
{
    private readonly ToolShopDbContext _context;
    private readonly IDiscountCalculationService _discountCalculationService;
    private readonly INotificationService _notificationService;

    // Пороги скидок в BYN
    private static readonly Dictionary<decimal, decimal> DiscountThresholds = new()
    {
        { 1000m, 3m },
        { 5000m, 5m },
        { 10000m, 10m }
    };

    public LoyaltyService(
        ToolShopDbContext context,
        IDiscountCalculationService discountCalculationService,
        INotificationService notificationService)
    {
        _context = context;
        _discountCalculationService = discountCalculationService;
        _notificationService = notificationService;
    }

    public async Task<LoyaltyDataDto?> GetUserLoyaltyDataAsync(int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            return null;

        var recommendedDiscount = GetRecommendedDiscount(user.TotalOrdersAmount);
        var progress = _discountCalculationService.CalculateProgress(user.TotalOrdersAmount, user.CurrentDiscount);

        return new LoyaltyDataDto
        {
            UserId = user.Id,
            TotalOrdersAmount = user.TotalOrdersAmount,
            CurrentDiscount = user.CurrentDiscount,
            RecommendedDiscount = recommendedDiscount,
            Progress = progress
        };
    }

    public async Task<bool> UpdateUserDiscountAsync(int userId, decimal newDiscount, int adminId, string? reason = null)
    {
        if (newDiscount < 0 || newDiscount > 100)
            throw new ArgumentException("Процент скидки должен быть от 0 до 100", nameof(newDiscount));

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return false;

            var oldDiscount = user.CurrentDiscount;
            user.CurrentDiscount = newDiscount;

            // Создать запись в истории
            var historyEntry = new DiscountHistory
            {
                UserId = userId,
                OldDiscount = oldDiscount,
                NewDiscount = newDiscount,
                ChangedBy = adminId,
                ChangedAt = DateTime.UtcNow,
                Reason = reason
            };
            _context.DiscountHistories.Add(historyEntry);

            await _context.SaveChangesAsync();

            // Отправить уведомление пользователю
            await _notificationService.CreateNotificationAsync(
                userId,
                "Изменение скидки",
                $"Ваша скидка изменена с {oldDiscount}% на {newDiscount}%",
                "loyalty"
            );

            await transaction.CommitAsync();
            return true;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task UpdateTotalOrdersAmountAsync(int userId, decimal amount, bool isAddition)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                throw new ArgumentException("Пользователь не найден", nameof(userId));

            if (isAddition)
            {
                user.TotalOrdersAmount += amount;
            }
            else
            {
                user.TotalOrdersAmount -= amount;
                // Не допускаем отрицательных значений
                if (user.TotalOrdersAmount < 0)
                    user.TotalOrdersAmount = 0;
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public decimal GetRecommendedDiscount(decimal totalOrdersAmount)
    {
        var thresholds = DiscountThresholds.OrderByDescending(kvp => kvp.Key);
        
        foreach (var threshold in thresholds)
        {
            if (totalOrdersAmount >= threshold.Key)
                return threshold.Value;
        }

        return 0m;
    }

    public async Task<List<DiscountHistoryDto>> GetDiscountHistoryAsync(int userId, int limit = 10)
    {
        var history = await _context.DiscountHistories
            .Include(h => h.ChangedByUser)
            .Where(h => h.UserId == userId)
            .OrderByDescending(h => h.ChangedAt)
            .Take(limit)
            .Select(h => new DiscountHistoryDto
            {
                Id = h.Id,
                OldDiscount = h.OldDiscount,
                NewDiscount = h.NewDiscount,
                ChangedByName = h.ChangedByUser.FullName ?? h.ChangedByUser.Email,
                ChangedAt = h.ChangedAt,
                Reason = h.Reason
            })
            .ToListAsync();

        return history;
    }
}
