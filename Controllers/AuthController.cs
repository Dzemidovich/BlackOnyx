using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Diplom.Models;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using Diplom.Services;

namespace Diplom.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ToolShopDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(ToolShopDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpPost("register")]
        [EnableRateLimiting("registration")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.Email) ||
                string.IsNullOrEmpty(request.Password) || string.IsNullOrEmpty(request.FullName))
            {
                return BadRequest(new AuthResponse { Success = false, Message = "Все поля обязательны для заполнения" });
            }

            // Валидация email
            if (!IsValidEmail(request.Email))
            {
                return BadRequest(new AuthResponse { Success = false, Message = "Некорректный формат email" });
            }

            // Валидация пароля
            if (request.Password.Length < 8)
            {
                return BadRequest(new AuthResponse { Success = false, Message = "Пароль должен содержать минимум 8 символов" });
            }

            if (!HasStrongPassword(request.Password))
            {
                return BadRequest(new AuthResponse { Success = false, Message = "Пароль должен содержать буквы и цифры" });
            }

            // Валидация для юридических лиц
            if (request.IsLegalEntity)
            {
                if (string.IsNullOrWhiteSpace(request.CompanyName))
                {
                    return BadRequest(new AuthResponse { Success = false, Message = "Название организации обязательно для юридических лиц" });
                }
                
                if (string.IsNullOrWhiteSpace(request.Unp))
                {
                    return BadRequest(new AuthResponse { Success = false, Message = "УНП обязателен для юридических лиц" });
                }
                
                // Проверка формата УНП (9 цифр)
                if (!System.Text.RegularExpressions.Regex.IsMatch(request.Unp, @"^\d{9}$"))
                {
                    return BadRequest(new AuthResponse { Success = false, Message = "УНП должен содержать 9 цифр" });
                }
                
                // Проверка уникальности УНП
                if (await _context.Users.AnyAsync(u => u.Unp == request.Unp))
                {
                    return BadRequest(new AuthResponse { Success = false, Message = "Организация с таким УНП уже зарегистрирована" });
                }
                
                // Валидация банковских реквизитов (если заполнены)
                if (!string.IsNullOrWhiteSpace(request.BankCode) && request.BankCode.Length != 9)
                {
                    return BadRequest(new AuthResponse { Success = false, Message = "БИК банка должен содержать 9 символов" });
                }
                
                if (!string.IsNullOrWhiteSpace(request.CheckingAccount) && request.CheckingAccount.Length != 28)
                {
                    return BadRequest(new AuthResponse { Success = false, Message = "Расчетный счет должен содержать 28 символов (IBAN)" });
                }
            }

            // Check if user already exists
            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            {
                SecurityLogger.LogRegistration(request.Email, false, GetClientIp(), "Email already exists");
                return BadRequest(new AuthResponse { Success = false, Message = "Пользователь с таким email уже существует" });
            }

            // Регистрация ТОЛЬКО как Customer (безопасность)
            // Роли Admin и Manager назначаются только администратором
            request.Role = "Customer";

            // Hash password
            var passwordHash = HashPassword(request.Password);

            var user = new User
            {
                Email = request.Email,
                PasswordHash = passwordHash,
                FullName = request.FullName,
                Role = request.Role,
                CreatedAt = DateTime.UtcNow,
                IsActive = false,  // Неактивен до одобрения администратором
                RegistrationStatus = "pending",  // Ожидает модерации
                
                // Данные юридического лица
                IsLegalEntity = request.IsLegalEntity,
                CompanyName = request.CompanyName,
                Unp = request.Unp,
                LegalAddress = request.LegalAddress,
                ActualAddress = request.ActualAddress,
                BankName = string.IsNullOrWhiteSpace(request.BankName) ? null : request.BankName,
                BankCode = string.IsNullOrWhiteSpace(request.BankCode) ? null : request.BankCode,
                CheckingAccount = string.IsNullOrWhiteSpace(request.CheckingAccount) ? null : request.CheckingAccount,
                DirectorName = request.DirectorName,
                ContactPhone = request.ContactPhone,
                ContactPerson = request.ContactPerson
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Логируем успешную регистрацию
            SecurityLogger.LogRegistration(user.Email, true, GetClientIp());

            // Не генерируем токен для неактивного пользователя
            var userDto = new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                Role = user.Role,
                CreatedAt = user.CreatedAt,
                IsLegalEntity = user.IsLegalEntity,
                CompanyName = user.CompanyName,
                Unp = user.Unp
            };

            return Ok(new AuthResponse
            {
                Success = true,
                Message = "Регистрация успешна. Ваша заявка отправлена на модерацию администратору.",
                Token = null,  // Токен не выдаём до одобрения
                User = userDto
            });
        }

        [HttpPost("login")]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest(new AuthResponse { Success = false, Message = "Email и пароль обязательны" });
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null || !VerifyPassword(request.Password, user.PasswordHash))
            {
                SecurityLogger.LogLoginAttempt(request.Email, false, GetClientIp(), "Invalid credentials");
                return Unauthorized(new AuthResponse { Success = false, Message = "Неверный email или пароль" });
            }

            // Проверка активности аккаунта
            if (user.IsActive == false)
            {
                var message = user.RegistrationStatus switch
                {
                    "pending" => "Ваша заявка на регистрацию ожидает одобрения администратором.",
                    "rejected" => $"Ваша заявка на регистрацию отклонена. Причина: {user.RejectionReason ?? "не указана"}",
                    _ => "Ваша учетная запись неактивна. Обратитесь к администратору."
                };
                SecurityLogger.LogLoginAttempt(request.Email, false, GetClientIp(), $"Account inactive: {user.RegistrationStatus}");
                return Unauthorized(new AuthResponse { Success = false, Message = message });
            }

            // Generate token
            var token = GenerateJwtToken(user);

            // Логируем успешный вход
            SecurityLogger.LogLoginAttempt(request.Email, true, GetClientIp());

            var userDto = new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                Role = user.Role,
                CreatedAt = user.CreatedAt
            };

            return Ok(new AuthResponse
            {
                Success = true,
                Message = "Вход выполнен успешно",
                Token = token,
                User = userDto
            });
        }

        private string HashPassword(string password)
        {
            return BCrypt.Net.BCrypt.HashPassword(password);
        }

        private bool VerifyPassword(string password, string hash)
        {
            try
            {
                return BCrypt.Net.BCrypt.Verify(password, hash);
            }
            catch
            {
                // Fallback для старых паролей (удалить после миграции всех паролей)
                return password == hash;
            }
        }

        private string GenerateJwtToken(User user)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            
            // Приоритет: переменная окружения > appsettings
            var secretKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY") 
                ?? jwtSettings["SecretKey"] 
                ?? "default-secret-key-for-development";
                
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.FullName ?? ""),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim("UserId", user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()) // Уникальный ID токена
            };

            // Срок жизни токена: 2 часа (вместо 24)
            var tokenExpiration = DateTime.UtcNow.AddHours(2);

            var token = new JwtSecurityToken(
                issuer: Environment.GetEnvironmentVariable("JWT_ISSUER") ?? jwtSettings["Issuer"] ?? "ToolShop",
                audience: Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? jwtSettings["Audience"] ?? "ToolShopUsers",
                claims: claims,
                expires: tokenExpiration,
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        // PUT: api/auth/profile (редактирование своего профиля)
        [HttpPut("profile")]
        [Authorize]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("Требуется авторизация");
            }

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound("Пользователь не найден");
            }

            // Обновление данных профиля
            if (!string.IsNullOrWhiteSpace(request.FullName))
            {
                user.FullName = request.FullName;
            }

            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Профиль обновлён", fullName = user.FullName });
        }

        // GET: api/auth/me (получить текущего пользователя)
        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetCurrentUser()
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("Требуется авторизация");
            }

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound("Пользователь не найден");
            }

            return Ok(new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName ?? "",
                Role = user.Role ?? "Customer",
                CreatedAt = user.CreatedAt,
                IsLegalEntity = user.IsLegalEntity,
                CompanyName = user.CompanyName,
                Unp = user.Unp,
                LegalAddress = user.LegalAddress,
                ActualAddress = user.ActualAddress,
                ContactPhone = user.ContactPhone,
                ContactPerson = user.ContactPerson
            });
        }

        // PUT: api/auth/password (смена пароля)
        [HttpPut("password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.CurrentPassword) ||
                string.IsNullOrEmpty(request.NewPassword))
            {
                return BadRequest(new { success = false, message = "Все поля обязательны" });
            }

            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("Требуется авторизация");
            }

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound("Пользователь не найден");
            }

            // Проверка текущего пароля
            if (!VerifyPassword(request.CurrentPassword, user.PasswordHash))
            {
                return BadRequest(new { success = false, message = "Неверный текущий пароль" });
            }

            // Обновление пароля
            user.PasswordHash = HashPassword(request.NewPassword);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Пароль успешно изменён" });
        }

        // Валидация email
        private bool IsValidEmail(string email)
        {
            try
            {
                var addr = new System.Net.Mail.MailAddress(email);
                return addr.Address == email;
            }
            catch
            {
                return false;
            }
        }

        // Проверка надёжности пароля
        private bool HasStrongPassword(string password)
        {
            if (password.Length < 8) return false;
            
            bool hasLetter = password.Any(char.IsLetter);
            bool hasDigit = password.Any(char.IsDigit);
            
            return hasLetter && hasDigit;
        }

        // Получение IP адреса клиента
        private string GetClientIp()
        {
            return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        }
    }

    // DTOs inline since we can't modify existing structure
    public class RegisterRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Role { get; set; } = "Customer";
        
        // Данные юридического лица (опционально)
        public bool IsLegalEntity { get; set; } = false;
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

    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class AuthResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? Token { get; set; }
        public UserDto? User { get; set; }
    }

    public class UserDto
    {
        public int Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public DateTime? CreatedAt { get; set; }
        
        // Данные юридического лица
        public bool IsLegalEntity { get; set; }
        public string? CompanyName { get; set; }
        public string? Unp { get; set; }
        public string? LegalAddress { get; set; }
        public string? ActualAddress { get; set; }
        public string? ContactPhone { get; set; }
        public string? ContactPerson { get; set; }
    }

    public class UpdateProfileRequest
    {
        public string? FullName { get; set; }
    }

    public class ChangePasswordRequest
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }
}
