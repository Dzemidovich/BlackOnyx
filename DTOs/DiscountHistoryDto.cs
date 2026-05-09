namespace Diplom.DTOs;

public class DiscountHistoryDto
{
    public int Id { get; set; }
    public decimal OldDiscount { get; set; }
    public decimal NewDiscount { get; set; }
    public string ChangedByName { get; set; } = string.Empty;
    public DateTime ChangedAt { get; set; }
    public string? Reason { get; set; }
}
