using FluentValidation;
using Diplom.Controllers;
using System.Text.RegularExpressions;

namespace Diplom.Validators
{
    /// <summary>
    /// Валидатор для регистрации пользователя
    /// </summary>
    public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
    {
        public RegisterRequestValidator()
        {
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email обязателен")
                .EmailAddress().WithMessage("Некорректный формат email")
                .MaximumLength(100).WithMessage("Email не может быть длиннее 100 символов");

            RuleFor(x => x.Password)
                .NotEmpty().WithMessage("Пароль обязателен")
                .MinimumLength(8).WithMessage("Пароль должен содержать минимум 8 символов")
                .MaximumLength(100).WithMessage("Пароль не может быть длиннее 100 символов")
                .Must(ContainUppercase).WithMessage("Пароль должен содержать хотя бы одну заглавную букву")
                .Must(ContainLowercase).WithMessage("Пароль должен содержать хотя бы одну строчную букву")
                .Must(ContainDigit).WithMessage("Пароль должен содержать хотя бы одну цифру")
                .Must(ContainSpecialChar).WithMessage("Пароль должен содержать хотя бы один специальный символ (!@#$%^&*)");

            RuleFor(x => x.FullName)
                .NotEmpty().WithMessage("Имя обязательно")
                .MinimumLength(2).WithMessage("Имя должно содержать минимум 2 символа")
                .MaximumLength(100).WithMessage("Имя не может быть длиннее 100 символов");
        }

        private bool ContainUppercase(string password)
        {
            return password.Any(char.IsUpper);
        }

        private bool ContainLowercase(string password)
        {
            return password.Any(char.IsLower);
        }

        private bool ContainDigit(string password)
        {
            return password.Any(char.IsDigit);
        }

        private bool ContainSpecialChar(string password)
        {
            return Regex.IsMatch(password, @"[!@#$%^&*()_+\-=\[\]{};':""\\|,.<>\/?]");
        }
    }

    /// <summary>
    /// Валидатор для входа пользователя
    /// </summary>
    public class LoginRequestValidator : AbstractValidator<LoginRequest>
    {
        public LoginRequestValidator()
        {
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email обязателен")
                .EmailAddress().WithMessage("Некорректный формат email");

            RuleFor(x => x.Password)
                .NotEmpty().WithMessage("Пароль обязателен");
        }
    }

    /// <summary>
    /// Валидатор для смены пароля
    /// </summary>
    public class ChangePasswordRequestValidator : AbstractValidator<ChangePasswordRequest>
    {
        public ChangePasswordRequestValidator()
        {
            RuleFor(x => x.CurrentPassword)
                .NotEmpty().WithMessage("Текущий пароль обязателен");

            RuleFor(x => x.NewPassword)
                .NotEmpty().WithMessage("Новый пароль обязателен")
                .MinimumLength(8).WithMessage("Пароль должен содержать минимум 8 символов")
                .MaximumLength(100).WithMessage("Пароль не может быть длиннее 100 символов")
                .Must(ContainUppercase).WithMessage("Пароль должен содержать хотя бы одну заглавную букву")
                .Must(ContainLowercase).WithMessage("Пароль должен содержать хотя бы одну строчную букву")
                .Must(ContainDigit).WithMessage("Пароль должен содержать хотя бы одну цифру")
                .Must(ContainSpecialChar).WithMessage("Пароль должен содержать хотя бы один специальный символ (!@#$%^&*)");

            RuleFor(x => x)
                .Must(x => x.CurrentPassword != x.NewPassword)
                .WithMessage("Новый пароль должен отличаться от текущего");
        }

        private bool ContainUppercase(string password)
        {
            return password.Any(char.IsUpper);
        }

        private bool ContainLowercase(string password)
        {
            return password.Any(char.IsLower);
        }

        private bool ContainDigit(string password)
        {
            return password.Any(char.IsDigit);
        }

        private bool ContainSpecialChar(string password)
        {
            return Regex.IsMatch(password, @"[!@#$%^&*()_+\-=\[\]{};':""\\|,.<>\/?]");
        }
    }
}
