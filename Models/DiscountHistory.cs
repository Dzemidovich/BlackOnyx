using System;

namespace Diplom.Models;

/// <summary>
/// История изменений скидок пользователей для аудита
/// </summary>
public partial class DiscountHistory
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public decimal OldDiscount { get; set; }

    public decimal NewDiscount { get; set; }

    public int ChangedBy { get; set; }  // ID администратора, который изменил скидку

    public DateTime ChangedAt { get; set; }

    public string? Reason { get; set; }  // Опциональная причина изменения

    // Навигационные свойства
    public virtual User User { get; set; } = null!;

    public virtual User ChangedByUser { get; set; } = null!;
}
