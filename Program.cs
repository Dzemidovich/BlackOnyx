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

// --- 1. НАСТРОЙКА ПОРТА (ДЛЯ RENDER) ---
builder.WebHost.ConfigureKestrel(serverOptions =>
{
    var port = Environment.GetEnvironmentVariable("PORT");
    if (!string.IsNullOrEmpty(port) && int.TryParse(port, out var portNumber))
    {
        serverOptions.ListenAnyIP(portNumber);
    }
    else
    {
        serverOptions.ListenAnyIP(8888); 
    }
});

}

// --- 3. СЕРВИСЫ И КОНТРОЛЛЕРЫ ---
// КРИТИЧНО: Чтобы ошибка в фоне не вызывала статус 139 и остановку сайта
builder.Services.Configure<HostOptions>(options =>
{
    options.BackgroundServiceExceptionBehavior = BackgroundServiceExceptionBehavior.Ignore;
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<CreateProductValidator>();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 104857600; // 100 MB
});

builder.Services.AddAuthorization();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddMemoryCache();
builder.Services.AddScoped<Diplom.Services.HierarchicalFilterService>();
builder.Services.AddScoped<Diplom.Services.FilterCacheService>();
builder.Services.AddSingleton<Diplom.Services.ImportBackgroundService>();
builder.Services.AddHostedService(provider => provider.GetRequiredService<Diplom.Services.ImportBackgroundService>());

builder.Services.AddScoped<Diplom.Services.ILoyaltyService, Diplom.Services.LoyaltyService>();
builder.Services.AddScoped<Diplom.Services.IDiscountCalculationService, Diplom.Services.DiscountCalculationService>();
builder.Services.AddScoped<Diplom.Services.INotificationService, Diplom.Services.NotificationService>();

// --- 4. НАСТРОЙКА JWT ---
var jwtSecretKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY") ?? "your-very-long-fallback-secret-key-at-least-32-chars";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER") ?? "ToolShop",
            ValidAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? "ToolShopUsers",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecretKey))
        };
    });

// --- 5. НАСТРОЙКА CORS ---
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigins", policy =>
    {
        var rawOrigins = Environment.GetEnvironmentVariable("ALLOWED_ORIGINS");
        
        if (builder.Environment.IsDevelopment() || string.IsNullOrEmpty(rawOrigins))
        {
            // Если мы в разработке или список пуст — разрешаем всё, НО БЕЗ Credentials
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        }
        else
        {
            // Если список доменов задан (на Render) — разрешаем их С Credentials
            var origins = rawOrigins.Split(',', StringSplitOptions.RemoveEmptyEntries);
            
            policy.WithOrigins(origins)
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials(); 
        }
    });
});

// --- 6. RATE LIMITING ---
builder.Services.AddRateLimiter(options =>
{
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: partition => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));
});

var app = builder.Build();

// --- 7. КОНВЕЙЕР ОБРАБОТКИ (MIDDLEWARE) ---

app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Порядок важен! 
app.UseStaticFiles(); 
app.UseRouting(); // Добавлено явно для корректной работы Cors и RateLimiting

app.UseCors("AllowSpecificOrigins");
app.UseRateLimiter();

app.Use(async (context, next) =>
{
    context.Response.Headers.Remove("Server");
    context.Response.Headers.Remove("X-Powered-By");
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("X-Frame-Options", "DENY");
    context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
    await next();
});

if (!app.Environment.IsDevelopment() && Environment.GetEnvironmentVariable("DISABLE_HTTPS_REDIRECT") != "true")
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapFallbackToFile("index.html");

app.Run();
