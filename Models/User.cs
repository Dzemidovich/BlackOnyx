using System;
using System.Collections.Generic;

namespace Diplom.Models;

public partial class User
{
    public int Id { get; set; }

    public string Email { get; set; } = null!;

    public string PasswordHash { get; set; } = null!;

    public string? FullName { get; set; }

    public string Role { get; set; } = null!;

    public bool? IsActive { get; set; }

    public DateTime? CreatedAt { get; set; }

    // Данные юридического лица (для B2B)
    public string? CompanyName { get; set; }           // Название организации
    public string? Unp { get; set; }                   // УНП (Учетный номер плательщика) - 9 цифр
    public string? LegalAddress { get; set; }          // Юридический адрес
    public string? ActualAddress { get; set; }         // Фактический адрес
    public string? BankName { get; set; }              // Название банка
    public string? BankCode { get; set; }              // БИК банка
    public string? CheckingAccount { get; set; }       // Расчетный счет
    public string? DirectorName { get; set; }          // ФИО директора
    public string? ContactPhone { get; set; }          // Контактный телефон
    public string? ContactPerson { get; set; }         // Контактное лицо
    public bool IsLegalEntity { get; set; }            // Юридическое лицо или физическое

    // Модерация регистраций
    public string RegistrationStatus { get; set; } = "pending";  // pending, approved, rejected
    public string? RejectionReason { get; set; }       // Причина отклонения
    public DateTime? ModeratedAt { get; set; }         // Дата модерации
    public int? ModeratedBy { get; set; }              // ID модератора

    // Программа лояльности
    public decimal TotalOrdersAmount { get; set; } = 0;  // Общая сумма всех завершенных заказов
    public decimal CurrentDiscount { get; set; } = 0;    // Текущий процент скидки (0-100)

    public virtual ICollection<Cart> Carts { get; set; } = new List<Cart>();

    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();

    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();

    public virtual ICollection<DiscountHistory> DiscountHistories { get; set; } = new List<DiscountHistory>();


}
