using Diplom.DTOs;
using Diplom.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Diplom.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LoyaltyController : ControllerBase
{
    private readonly ILoyaltyService _loyaltyService;

    public LoyaltyController(ILoyaltyService loyaltyService)
    {
        _loyaltyService = loyaltyService;
    }

    [HttpGet("user/{userId}")]
    public async Task<ActionResult<LoyaltyDataDto>> GetUserLoyaltyData(int userId)
    {
        var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

        // Пользователь может видеть только свои данные, админ - все
        if (userRole != "Admin" && currentUserId != userId)
            return Forbid();

        var loyaltyData = await _loyaltyService.GetUserLoyaltyDataAsync(userId);
        if (loyaltyData == null)
            return NotFound(new { message = "Пользователь не найден" });

        return Ok(loyaltyData);
    }

    [HttpPut("user/{userId}/discount")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> UpdateUserDiscount(int userId, [FromBody] UpdateDiscountDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var adminId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

        try
        {
            var result = await _loyaltyService.UpdateUserDiscountAsync(userId, dto.NewDiscount, adminId, dto.Reason);
            if (!result)
                return NotFound(new { message = "Пользователь не найден" });

            return Ok(new { message = "Скидка успешно обновлена" });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("user/{userId}/history")]
    public async Task<ActionResult<List<DiscountHistoryDto>>> GetDiscountHistory(int userId, [FromQuery] int limit = 10)
    {
        var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

        // Пользователь может видеть только свою историю, админ - всю
        if (userRole != "Admin" && currentUserId != userId)
            return Forbid();

        var history = await _loyaltyService.GetDiscountHistoryAsync(userId, limit);
        return Ok(history);
    }

    [HttpGet("thresholds")]
    [AllowAnonymous]
    public ActionResult<object> GetThresholds()
    {
        var thresholds = new[]
        {
            new { Amount = 1000m, Discount = 3m },
            new { Amount = 5000m, Discount = 5m },
            new { Amount = 10000m, Discount = 10m }
        };

        return Ok(thresholds);
    }
}
