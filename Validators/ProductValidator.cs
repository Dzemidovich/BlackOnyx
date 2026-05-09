using FluentValidation;
using Diplom.Controllers;

namespace Diplom.Validators
{
    /// <summary>
    /// Валидатор для создания продукта
    /// </summary>
    public class CreateProductValidator : AbstractValidator<CreateProductDto>
    {
        public CreateProductValidator()
        {
            RuleFor(x => x.Article)
                .NotEmpty().WithMessage("Артикул обязателен")
                .MaximumLength(50).WithMessage("Артикул не может быть длиннее 50 символов");

            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Название обязательно")
                .MaximumLength(200).WithMessage("Название не может быть длиннее 200 символов");

            RuleFor(x => x.Price)
                .GreaterThan(0).WithMessage("Цена должна быть больше 0")
                .LessThan(1000000).WithMessage("Цена не может быть больше 1,000,000");

            RuleFor(x => x.Stock)
                .GreaterThanOrEqualTo(0).WithMessage("Остаток не может быть отрицательным");

            RuleFor(x => x.Description)
                .MaximumLength(2000).WithMessage("Описание не может быть длиннее 2000 символов")
                .When(x => !string.IsNullOrEmpty(x.Description));

            RuleFor(x => x.ImageUrl)
                .MaximumLength(500).WithMessage("URL изображения не может быть длиннее 500 символов")
                .When(x => !string.IsNullOrEmpty(x.ImageUrl));
        }
    }

    /// <summary>
    /// Валидатор для обновления продукта
    /// </summary>
    public class UpdateProductValidator : AbstractValidator<UpdateProductDto>
    {
        public UpdateProductValidator()
        {
            RuleFor(x => x.Article)
                .NotEmpty().WithMessage("Артикул обязателен")
                .MaximumLength(50).WithMessage("Артикул не может быть длиннее 50 символов");

            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Название обязательно")
                .MaximumLength(200).WithMessage("Название не может быть длиннее 200 символов");

            RuleFor(x => x.Price)
                .GreaterThan(0).WithMessage("Цена должна быть больше 0")
                .LessThan(1000000).WithMessage("Цена не может быть больше 1,000,000");

            RuleFor(x => x.Stock)
                .GreaterThanOrEqualTo(0).WithMessage("Остаток не может быть отрицательным");

            RuleFor(x => x.Description)
                .MaximumLength(2000).WithMessage("Описание не может быть длиннее 2000 символов")
                .When(x => !string.IsNullOrEmpty(x.Description));

            RuleFor(x => x.ImageUrl)
                .MaximumLength(500).WithMessage("URL изображения не может быть длиннее 500 символов")
                .When(x => !string.IsNullOrEmpty(x.ImageUrl));
        }
    }

    /// <summary>
    /// Валидатор для пополнения остатков
    /// </summary>
    public class RestockValidator : AbstractValidator<RestockDto>
    {
        public RestockValidator()
        {
            RuleFor(x => x.Quantity)
                .GreaterThan(0).WithMessage("Количество должно быть больше 0")
                .LessThan(100000).WithMessage("Количество не может быть больше 100,000");
        }
    }
}
