using Microsoft.AspNetCore.Diagnostics;
using System.Net;
using System.Text.Json;

namespace Diplom.Middleware
{
    /// <summary>
    /// Глобальный обработчик ошибок для всего приложения
    /// </summary>
    public class GlobalExceptionHandler : IExceptionHandler
    {
        private readonly ILogger<GlobalExceptionHandler> _logger;
        private readonly IHostEnvironment _environment;

        public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger, IHostEnvironment environment)
        {
            _logger = logger;
            _environment = environment;
        }

        public async ValueTask<bool> TryHandleAsync(
            HttpContext httpContext,
            Exception exception,
            CancellationToken cancellationToken)
        {
            // Логируем ошибку
            _logger.LogError(exception, 
                "Произошла необработанная ошибка: {Message}. Path: {Path}", 
                exception.Message, 
                httpContext.Request.Path);

            // Определяем статус код и сообщение
            var (statusCode, message) = exception switch
            {
                ArgumentNullException => (HttpStatusCode.BadRequest, "Отсутствует обязательный параметр"),
                ArgumentException => (HttpStatusCode.BadRequest, "Некорректные данные"),
                KeyNotFoundException => (HttpStatusCode.NotFound, "Ресурс не найден"),
                UnauthorizedAccessException => (HttpStatusCode.Unauthorized, "Доступ запрещен"),
                InvalidOperationException => (HttpStatusCode.BadRequest, "Недопустимая операция"),
                _ => (HttpStatusCode.InternalServerError, "Внутренняя ошибка сервера")
            };

            // Формируем ответ
            var response = new ErrorResponse
            {
                StatusCode = (int)statusCode,
                Message = message,
                // В режиме разработки показываем детали ошибки
                Details = _environment.IsDevelopment() ? exception.Message : null,
                StackTrace = _environment.IsDevelopment() ? exception.StackTrace : null,
                Timestamp = DateTime.UtcNow
            };

            httpContext.Response.StatusCode = (int)statusCode;
            httpContext.Response.ContentType = "application/json; charset=utf-8";

            var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                WriteIndented = true
            });

            await httpContext.Response.WriteAsync(json, cancellationToken);

            return true; // Ошибка обработана
        }
    }

    /// <summary>
    /// Модель ответа при ошибке
    /// </summary>
    public class ErrorResponse
    {
        public int StatusCode { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? Details { get; set; }
        public string? StackTrace { get; set; }
        public DateTime Timestamp { get; set; }
    }
}
