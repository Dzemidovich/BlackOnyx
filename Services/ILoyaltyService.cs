using Diplom.DTOs;

namespace Diplom.Services;

public interface ILoyaltyService
{
    Task<LoyaltyDataDto?> GetUserLoyaltyDataAsync(int userId);
    Task<bool> UpdateUserDiscountAsync(int userId, decimal newDiscount, int adminId, string? reason = null);
    Task UpdateTotalOrdersAmountAsync(int userId, decimal amount, bool isAddition);
    decimal GetRecommendedDiscount(decimal totalOrdersAmount);
    Task<List<DiscountHistoryDto>> GetDiscountHistoryAsync(int userId, int limit = 10);
}
