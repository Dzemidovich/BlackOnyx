using Diplom.DTOs;

namespace Diplom.Services;

public interface IDiscountCalculationService
{
    decimal ApplyDiscount(decimal price, decimal discountPercent);
    decimal CalculateDiscountAmount(decimal totalAmount, decimal discountPercent);
    DiscountProgressDto CalculateProgress(decimal totalOrdersAmount, decimal currentDiscount);
}
