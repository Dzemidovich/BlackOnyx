using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Diplom.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;

namespace Diplom.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class UsersController : ControllerBase
    {
        private readonly ToolShopDbContext _context;

        public UsersController(ToolShopDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<AdminUserDto>>> GetUsers(
            [FromQuery] decimal? minTotalOrders = null,
            [FromQuery] decimal? maxTotalOrders = null,
            [FromQuery] decimal? minDiscount = null,
            [FromQuery] decimal? maxDiscount = null,
            [FromQuery] string? sortBy = null,
            [FromQuery] string? sortDir = "asc")
        {
            var query = _context.Users.AsQueryable();

            // Фильтрация по TotalOrdersAmount
            if (minTotalOrders.HasValue)
            {
                query = query.Where(u => u.TotalOrdersAmount >= minTotalOrders.Value);
            }
            if (maxTotalOrders.HasValue)
            {
                query = query.Where(u => u.TotalOrdersAmount <= maxTotalOrders.Value);
            }

            // Фильтрация по CurrentDiscount
            if (minDiscount.HasValue)
            {
                query = query.Where(u => u.CurrentDiscount >= minDiscount.Value);
            }
            if (maxDiscount.HasValue)
            {
                query = query.Where(u => u.CurrentDiscount <= maxDiscount.Value);
            }

            // Сортировка
            if (!string.IsNullOrEmpty(sortBy))
            {
                query = sortBy.ToLower() switch
                {
                    "totalordersamount" => sortDir?.ToLower() == "desc" 
                        ? query.OrderByDescending(u => u.TotalOrdersAmount)
                        : query.OrderBy(u => u.TotalOrdersAmount),
                    "currentdiscount" => sortDir?.ToLower() == "desc"
                        ? query.OrderByDescending(u => u.CurrentDiscount)
                        : query.OrderBy(u => u.CurrentDiscount),
                    _ => query.OrderBy(u => u.Id)
                };
            }

            var users = await query.ToListAsync();

            var userDtos = users.Select(u => new AdminUserDto
            {
                Id = u.Id,
                Email = u.Email,
                FullName = u.FullName,
                Role = u.Role,
                IsActive = u.IsActive ?? true,
                CreatedAt = u.CreatedAt,
                OrdersCount = u.Orders.Count,
                CartItemsCount = u.Carts.Sum(c => c.CartItems.Count),
                TotalOrdersAmount = u.TotalOrdersAmount,
                CurrentDiscount = u.CurrentDiscount
            }).ToList();

            return Ok(userDtos);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<AdminUserDetailDto>> GetUser(int id)
        {
            var user = await _context.Users.FindAsync(id);

            if (user == null)
            {
                return NotFound();
            }

            var ordersCount = await _context.Orders.CountAsync(o => o.UserId == id);
            var cartItemsCount = await _context.CartItems
                .Where(ci => ci.Cart.UserId == id)
                .SumAsync(ci => (int?)ci.Quantity) ?? 0;

            var userDetail = new AdminUserDetailDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                Role = user.Role,
                IsActive = user.IsActive ?? true,
                CreatedAt = user.CreatedAt,
                OrdersCount = ordersCount,
                CartItemsCount = cartItemsCount,
                
                // Данные юридического лица
                IsLegalEntity = user.IsLegalEntity,
                CompanyName = user.CompanyName,
                Unp = user.Unp,
                LegalAddress = user.LegalAddress,
                ActualAddress = user.ActualAddress,
                BankName = user.BankName,
                BankCode = user.BankCode,
                CheckingAccount = user.CheckingAccount,
                DirectorName = user.DirectorName,
                ContactPhone = user.ContactPhone,
                ContactPerson = user.ContactPerson
            };

            return userDetail;
        }

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateUserStatus(int id, [FromBody] UpdateUserStatusDto statusDto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound();
            }

            user.IsActive = statusDto.IsActive;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPut("{id}/role")]
        public async Task<IActionResult> UpdateUserRole(int id, [FromBody] UpdateUserRoleDto roleDto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound();
            }

            if (roleDto.Role != "Admin" && roleDto.Role != "Customer" && roleDto.Role != "Manager")
            {
                return BadRequest("Некорректная роль пользователя. Допустимые значения: Admin, Customer, Manager");
            }

            user.Role = roleDto.Role;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users
                .Include(u => u.Orders)
                .Include(u => u.Carts)
                .Include(u => u.Notifications)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
            {
                return NotFound();
            }

            // Check if user has active orders
            if (user.Orders.Any(o => o.Status == "Новый" || o.Status == "В обработке"))
            {
                return BadRequest("Нельзя удалить пользователя с активными заказами");
            }

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // === МОДЕРАЦИЯ РЕГИСТРАЦИЙ ===

        [HttpGet("pending-registrations")]
        public async Task<ActionResult<IEnumerable<PendingRegistrationDto>>> GetPendingRegistrations()
        {
            var pendingUsers = await _context.Users
                .Where(u => u.RegistrationStatus == "pending")
                .OrderBy(u => u.CreatedAt)
                .ToListAsync();

            var dtos = pendingUsers.Select(u => new PendingRegistrationDto
            {
                Id = u.Id,
                Email = u.Email,
                FullName = u.FullName,
                Role = u.Role,
                CreatedAt = u.CreatedAt,
                IsLegalEntity = u.IsLegalEntity,
                CompanyName = u.CompanyName,
                Unp = u.Unp,
                LegalAddress = u.LegalAddress,
                ActualAddress = u.ActualAddress,
                BankName = u.BankName,
                BankCode = u.BankCode,
                CheckingAccount = u.CheckingAccount,
                DirectorName = u.DirectorName,
                ContactPhone = u.ContactPhone,
                ContactPerson = u.ContactPerson,
                RegistrationStatus = u.RegistrationStatus,
                RejectionReason = u.RejectionReason,
                ModeratedAt = u.ModeratedAt
            }).ToList();

            return Ok(dtos);
        }

        [HttpGet("registrations")]
        public async Task<ActionResult<IEnumerable<PendingRegistrationDto>>> GetRegistrationsByStatus([FromQuery] string status)
        {
            IQueryable<User> query = _context.Users;

            // Фильтруем по статусу
            if (status != "all")
            {
                query = query.Where(u => u.RegistrationStatus == status);
            }

            var users = await query
                .OrderByDescending(u => u.ModeratedAt ?? u.CreatedAt)
                .ToListAsync();

            var dtos = users.Select(u => new PendingRegistrationDto
            {
                Id = u.Id,
                Email = u.Email,
                FullName = u.FullName,
                Role = u.Role,
                CreatedAt = u.CreatedAt,
                IsLegalEntity = u.IsLegalEntity,
                CompanyName = u.CompanyName,
                Unp = u.Unp,
                LegalAddress = u.LegalAddress,
                ActualAddress = u.ActualAddress,
                BankName = u.BankName,
                BankCode = u.BankCode,
                CheckingAccount = u.CheckingAccount,
                DirectorName = u.DirectorName,
                ContactPhone = u.ContactPhone,
                ContactPerson = u.ContactPerson,
                RegistrationStatus = u.RegistrationStatus,
                RejectionReason = u.RejectionReason,
                ModeratedAt = u.ModeratedAt
            }).ToList();

            return Ok(dtos);
        }

        [HttpPost("{id}/approve")]
        public async Task<IActionResult> ApproveRegistration(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound(new { message = "Пользователь не найден" });
            }

            if (user.RegistrationStatus != "pending")
            {
                return BadRequest(new { message = "Заявка уже обработана" });
            }

            var adminIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(adminIdClaim) || !int.TryParse(adminIdClaim, out var adminId))
            {
                return Unauthorized("Требуется авторизация");
            }

            user.RegistrationStatus = "approved";
            user.IsActive = true;
            user.ModeratedAt = DateTime.UtcNow;
            user.ModeratedBy = adminId;

            await _context.SaveChangesAsync();

            // Отправляем уведомление пользователю
            var notification = new Notification
            {
                UserId = user.Id,
                Title = "Регистрация одобрена",
                Message = "Ваша заявка на регистрацию одобрена. Теперь вы можете войти в систему.",
                Type = "system",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };
            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Регистрация одобрена", user = new { user.Id, user.Email, user.FullName } });
        }

        [HttpPost("{id}/reject")]
        public async Task<IActionResult> RejectRegistration(int id, [FromBody] RejectRegistrationDto dto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound(new { message = "Пользователь не найден" });
            }

            if (user.RegistrationStatus != "pending")
            {
                return BadRequest(new { message = "Заявка уже обработана" });
            }

            var adminIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(adminIdClaim) || !int.TryParse(adminIdClaim, out var adminId))
            {
                return Unauthorized("Требуется авторизация");
            }

            user.RegistrationStatus = "rejected";
            user.IsActive = false;
            user.RejectionReason = dto.Reason;
            user.ModeratedAt = DateTime.UtcNow;
            user.ModeratedBy = adminId;

            await _context.SaveChangesAsync();

            // Отправляем уведомление пользователю
            var notification = new Notification
            {
                UserId = user.Id,
                Title = "Регистрация отклонена",
                Message = $"Ваша заявка на регистрацию отклонена. Причина: {dto.Reason}",
                Type = "system",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };
            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Регистрация отклонена", reason = dto.Reason });
        }
    }

    // DTOs
    public class AdminUserDto
    {
        public int Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string? FullName { get; set; }
        public string Role { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime? CreatedAt { get; set; }
        public int OrdersCount { get; set; }
        public int CartItemsCount { get; set; }
        public decimal TotalOrdersAmount { get; set; }
        public decimal CurrentDiscount { get; set; }
    }

    public class UpdateUserStatusDto
    {
        public bool IsActive { get; set; }
    }

    public class UpdateUserRoleDto
    {
        public string Role { get; set; } = string.Empty;
    }

    public class PendingRegistrationDto
    {
        public int Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string? FullName { get; set; }
        public string Role { get; set; } = string.Empty;
        public DateTime? CreatedAt { get; set; }
        public bool IsLegalEntity { get; set; }
        public string? CompanyName { get; set; }
        public string? Unp { get; set; }
        public string? LegalAddress { get; set; }
        public string? ActualAddress { get; set; }
        public string? BankName { get; set; }
        public string? BankCode { get; set; }
        public string? CheckingAccount { get; set; }
        public string? DirectorName { get; set; }
        public string? ContactPhone { get; set; }
        public string? ContactPerson { get; set; }
        public string RegistrationStatus { get; set; } = string.Empty;
        public string? RejectionReason { get; set; }
        public DateTime? ModeratedAt { get; set; }
    }

    public class RejectRegistrationDto
    {
        public string Reason { get; set; } = string.Empty;
    }

    public class AdminUserDetailDto : AdminUserDto
    {
        // Данные юридического лица
        public bool IsLegalEntity { get; set; }
        public string? CompanyName { get; set; }
        public string? Unp { get; set; }
        public string? LegalAddress { get; set; }
        public string? ActualAddress { get; set; }
        public string? BankName { get; set; }
        public string? BankCode { get; set; }
        public string? CheckingAccount { get; set; }
        public string? DirectorName { get; set; }
        public string? ContactPhone { get; set; }
        public string? ContactPerson { get; set; }
    }
}
