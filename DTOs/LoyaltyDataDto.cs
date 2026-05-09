namespace Diplom.DTOs;

public class LoyaltyDataDto
{
    public int UserId { get; set; }
    public decimal TotalOrdersAmount { get; set; }
    public decimal CurrentDiscount { get; set; }
    public decimal RecommendedDiscount { get; set; }
    public DiscountProgressDto Progress { get; set; } = null!;
}
