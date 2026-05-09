using Diplom.DTOs;

namespace Diplom.Services;

public class DiscountCalculationService : IDiscountCalculationService
{
    // Пороги скидок в BYN
    private static readonly Dictionary<decimal, decimal> DiscountThresholds = new()
    {
        { 1000m, 3m },
        { 5000m, 5m },
        { 10000m, 10m }
    };

    public decimal ApplyDiscount(decimal price, decimal discountPercent)
    {
        if (price < 0)
            throw new ArgumentException("Цена не может быть отрицательной", nameof(price));
        
        if (discountPercent < 0 || discountPercent > 100)
            throw new ArgumentException("Процент скидки должен быть от 0 до 100", nameof(discountPercent));

        var discountedPrice = price * (1 - discountPercent / 100);
        return Math.Max(0, discountedPrice);
    }

    public decimal CalculateDiscountAmount(decimal totalAmount, decimal discountPercent)
    {
        if (totalAmount < 0)
            throw new ArgumentException("Сумма не может быть отрицательной", nameof(totalAmount));
        
        if (discountPercent < 0 || discountPercent > 100)
            throw new ArgumentException("Процент скидки должен быть от 0 до 100", nameof(discountPercent));

        return totalAmount * (discountPercent / 100);
    }

    public DiscountProgressDto CalculateProgress(decimal totalOrdersAmount, decimal currentDiscount)
    {
        var thresholds = DiscountThresholds.Keys.OrderBy(k => k).ToList();
        
        // Найти следующий порог
        var nextThreshold = thresholds.FirstOrDefault(t => t > totalOrdersAmount);
        
        if (nextThreshold == 0)
        {
            // Достигнут максимальный уровень
            return new DiscountProgressDto
            {
                CurrentAmount = totalOrdersAmount,
                NextThreshold = 0,
                NextThresholdDiscount = 0,
                ProgressPercent = 100,
                IsMaxLevel = true
            };
        }

        // Найти предыдущий порог для расчета прогресса
        var previousThreshold = thresholds.LastOrDefault(t => t <= totalOrdersAmount);
        var rangeStart = previousThreshold;
        var rangeEnd = nextThreshold;
        var rangeSize = rangeEnd - rangeStart;
        var currentProgress = totalOrdersAmount - rangeStart;
        var progressPercent = rangeSize > 0 ? (int)((currentProgress / rangeSize) * 100) : 0;

        return new DiscountProgressDto
        {
            CurrentAmount = totalOrdersAmount,
            NextThreshold = nextThreshold,
            NextThresholdDiscount = DiscountThresholds[nextThreshold],
            ProgressPercent = progressPercent,
            IsMaxLevel = false
        };
    }
}
