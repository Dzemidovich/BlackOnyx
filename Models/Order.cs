using System;
using System.Collections.Generic;

namespace Diplom.Models;

public partial class Order
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public decimal? TotalAmount { get; set; }

    public string? Status { get; set; }

    public DateTime? CreatedAt { get; set; }

    public string? Comment { get; set; }  // Комментарий к заказу

    // Программа лояльности
    public decimal? AppliedDiscount { get; set; }  // Процент примененной скидки (0-100)
    public decimal? DiscountAmount { get; set; }   // Сумма скидки в BYN

    public virtual User User { get; set; } = null!;

    public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}
