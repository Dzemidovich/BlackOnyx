using System.ComponentModel.DataAnnotations;

namespace Diplom.DTOs;

public class UpdateDiscountDto
{
    [Required]
    [Range(0, 100, ErrorMessage = "Процент скидки должен быть от 0 до 100")]
    public decimal NewDiscount { get; set; }
    
    [MaxLength(500, ErrorMessage = "Причина не может превышать 500 символов")]
    public string? Reason { get; set; }
}
