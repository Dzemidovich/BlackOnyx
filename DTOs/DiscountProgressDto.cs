namespace Diplom.DTOs;

public class DiscountProgressDto
{
    public decimal CurrentAmount { get; set; }
    public decimal NextThreshold { get; set; }
    public decimal NextThresholdDiscount { get; set; }
    public int ProgressPercent { get; set; }
    public bool IsMaxLevel { get; set; }
}
