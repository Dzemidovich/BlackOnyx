using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Diplom.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using FluentValidation;
using FluentValidation.AspNetCore;
using Diplom.Validators;
using Diplom.Middleware;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// Настройка URL - адаптируется под окружение
builder.WebHost.ConfigureKestrel(serverOptions =>
{
    // В production используем переменную окружения PORT или стандартный порт
    var port = Environment.GetEnvironmentVariable("PORT");
    
    if (!string.IsNullOrEmpty(port) && int.TryParse(port, out var portNumber))
    {
        serverOptions.ListenAnyIP(portNumber);
    }
    else if (builder.Environment.IsDevelopment())
    {
        serverOptions.ListenAnyIP(8888); // HTTP на всех интерфейсах для разработки
    }
    // В production хостинг сам настроит порты
});

// Добавить контроллеры с настройками JSON и валидацией
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

// Добавить FluentValidation
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<CreateProductValidator>();

// Добавить глобальный обработчик ошибок
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

// Увеличить лимит размера загружаемых файлов
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 104857600; // 100 MB
});

builder.Services.Configure<Microsoft.AspNetCore.Server.Kestrel.Core.KestrelServerOptions>(options =>
{
    options.Limits.MaxRequestBodySize = 104857600; // 100 MB
    options.Limits.KeepAliveTimeout = TimeSpan.FromMinutes(10);
    options.Limits.RequestHeadersTimeout = TimeSpan.FromMinutes(10);
});

builder.Services.AddAuthorization();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Добавить контекст БД
builder.Services.AddDbContext<ToolShopDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Добавить сервисы
builder.Services.AddMemoryCache();
builder.Services.AddScoped<Diplom.Services.HierarchicalFilterService>();
builder.Services.AddScoped<Diplom.Services.FilterCacheService>();
builder.Services.AddSingleton<Diplom.Services.ImportBackgroundService>();
builder.Services.AddHostedService(provider => provider.GetRequiredService<Diplom.Services.ImportBackgroundService>());

// Loyalty Program Services
builder.Services.AddScoped<Diplom.Services.ILoyaltyService, Diplom.Services.LoyaltyService>();
builder.Services.AddScoped<Diplom.Services.IDiscountCalculationService, Diplom.Services.DiscountCalculationService>();
builder.Services.AddScoped<Diplom.Services.INotificationService, Diplom.Services.NotificationService>();


// Настройка JWT - поддержка переменных окружения
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var jwtSettings = builder.Configuration.GetSection("JwtSettings");
        
        // Приоритет: переменная окружения > appsettings
        var secretKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY") 
            ?? jwtSettings["SecretKey"] 
            ?? "default-secret-key-for-development";
            
        var issuer = Environment.GetEnvironmentVariable("JWT_ISSUER") 
            ?? jwtSettings["Issuer"] 
            ?? "ToolShop";
            
        var audience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") 
            ?? jwtSettings["Audience"] 
            ?? "ToolShopUsers";

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = issuer,
            ValidAudience = audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
        };
    });

// Настройка CORS - строгая политика безопасности
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigins", policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            // В разработке разрешаем localhost
            policy.WithOrigins(
                "http://localhost:8888",
                "https://localhost:7071",
                "http://127.0.0.1:8888"
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
        }
        else
        {
            // В production только конкретные домены из переменных окружения
            var allowedOrigins = Environment.GetEnvironmentVariable("ALLOWED_ORIGINS")?.Split(',')
                ?? builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
                ?? Array.Empty<string>();

            if (allowedOrigins.Length > 0)
            {
                policy.WithOrigins(allowedOrigins)
                      .WithMethods("GET", "POST", "PUT", "DELETE")
                      .WithHeaders("Content-Type", "Authorization")
                      .AllowCredentials();
            }
            else
            {
                throw new InvalidOperationException("ALLOWED_ORIGINS must be configured in production");
            }
        }
    });
});

// Rate Limiting для защиты от брутфорса
builder.Services.AddRateLimiter(options =>
{
    // Глобальный лимит
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: partition => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            }));

    // Строгий лимит для аутентификации
    options.AddFixedWindowLimiter("auth", options =>
    {
        options.PermitLimit = 5;
        options.Window = TimeSpan.FromMinutes(15);
        options.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        options.QueueLimit = 0;
    });

    // Лимит для регистрации
    options.AddFixedWindowLimiter("registration", options =>
    {
        options.PermitLimit = 3;
        options.Window = TimeSpan.FromHours(1);
        options.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        options.QueueLimit = 0;
    });
});

var app = builder.Build();

// Скрываем версию сервера (security)
app.Use(async (context, next) =>
{
    context.Response.Headers.Remove("Server");
    context.Response.Headers.Remove("X-Powered-By");
    context.Response.Headers.Remove("X-AspNet-Version");
    context.Response.Headers.Remove("X-AspNetMvc-Version");
    await next();
});

// Настройка статических файлов (без кэша для разработки)
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        ctx.Context.Response.Headers.Append("Cache-Control", "no-cache, no-store, must-revalidate");
        ctx.Context.Response.Headers.Append("Pragma", "no-cache");
        ctx.Context.Response.Headers.Append("Expires", "0");
    }
});

// Добавить глобальный обработчик ошибок
app.UseExceptionHandler();

// Настройка конвейера
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowSpecificOrigins");

// Security Headers
app.Use(async (context, next) =>
{
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("X-Frame-Options", "DENY");
    context.Response.Headers.Append("X-XSS-Protection", "1; mode=block");
    context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
    // CSP - разрешаем CDN для Font Awesome и Google Fonts
    context.Response.Headers.Append("Content-Security-Policy", 
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; " +
        "img-src 'self' data: https: blob:; " +
        "font-src 'self' data: https://fonts.gstatic.com https://cdnjs.cloudflare.com; " +
        "connect-src 'self'");
    await next();
});

// Rate Limiting
app.UseRateLimiter();

// HTTPS редирект только в production и если не отключен явно
if (!app.Environment.IsDevelopment() && 
    Environment.GetEnvironmentVariable("DISABLE_HTTPS_REDIRECT") != "true")
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Настройка маршрута для обслуживания SPA
app.MapFallbackToFile("index.html");

app.Run();
