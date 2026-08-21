using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using taskManagmentCofc.Server.Data;
using taskManagmentCofc.Server.DTOs.Common;
using taskManagmentCofc.Server.Middleware;
using taskManagmentCofc.Server.Security;
using taskManagmentCofc.Server.Services;
using taskManagmentCofc.Server.Services.Implementations;
using taskManagmentCofc.Server.Services.Interfaces;

namespace taskManagmentCofc.Server.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApiErrorHandling(this IServiceCollection services)
    {
        services.AddExceptionHandler<GlobalExceptionHandler>();
        services.Configure<ApiBehaviorOptions>(options =>
        {
            options.InvalidModelStateResponseFactory = actionContext =>
            {
                var errors = actionContext.ModelState
                    .Where(entry => entry.Value?.Errors.Count > 0)
                    .ToDictionary(
                        entry => entry.Key,
                        entry => entry.Value!.Errors
                            .Select(error => string.IsNullOrWhiteSpace(error.ErrorMessage)
                                ? "The supplied value is invalid."
                                : error.ErrorMessage)
                            .ToArray());

                return new BadRequestObjectResult(new ApiErrorResponse(
                    "VALIDATION_FAILED",
                    "One or more validation errors occurred.",
                    Errors: errors,
                    TraceId: actionContext.HttpContext.TraceIdentifier));
            };
        });

        return services;
    }

    public static IServiceCollection AddDatabase(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "Connection string 'DefaultConnection' is not configured.");
        }

        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(connectionString, sqlServerOptions =>
                sqlServerOptions.EnableRetryOnFailure()));

        return services;
    }

    public static IServiceCollection AddJwtAuthentication(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var jwtSection = configuration.GetSection(JwtOptions.SectionName);
        var issuer = jwtSection[nameof(JwtOptions.Issuer)];
        var audience = jwtSection[nameof(JwtOptions.Audience)];

        services
            .AddOptions<JwtOptions>()
            .Bind(jwtSection)
            .Validate(options => !string.IsNullOrWhiteSpace(options.Issuer), "JWT issuer is required.")
            .Validate(options => !string.IsNullOrWhiteSpace(options.Audience), "JWT audience is required.")
            .Validate(
                options => !string.IsNullOrWhiteSpace(options.Key) &&
                    Encoding.UTF8.GetByteCount(options.Key) >= 32,
                "JWT key must contain at least 32 bytes.")
            .Validate(options => options.ExpiresMinutes > 0, "JWT expiration must be positive.")
            .ValidateOnStart();

        services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.RequireHttpsMetadata = true;
                options.SaveToken = false;
                options.MapInboundClaims = false;
                options.EventsType = typeof(ActiveUserJwtEvents);
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = issuer,
                    ValidateAudience = true,
                    ValidAudience = audience,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    NameClaimType = "name",
                    RoleClaimType = "role",
                    ClockSkew = TimeSpan.Zero,
                    IssuerSigningKeyResolver = (_, _, _, _) =>
                    {
                        // يُقرأ مفتاح JWT من الإعدادات الآمنة ولا يُحفظ داخل المصدر.
                        var signingKey = configuration[$"{JwtOptions.SectionName}:{nameof(JwtOptions.Key)}"];

                        return string.IsNullOrWhiteSpace(signingKey)
                            ? []
                            : [new SymmetricSecurityKey(Encoding.UTF8.GetBytes(signingKey))];
                    }
                };
            });

        services.AddAuthorization();

        return services;
    }

    public static IServiceCollection AddApplicationServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<SmtpOptions>(configuration.GetSection(SmtpOptions.SectionName));
        services.Configure<SeedAdminOptions>(configuration.GetSection(SeedAdminOptions.SectionName));

        services.AddSingleton<IPasswordHasherService, PasswordHasherService>();
        services.AddSingleton<IJwtTokenService, JwtTokenService>();
        services.AddScoped<ActiveUserJwtEvents>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IAdminUserService, AdminUserService>();
        services.AddScoped<IAdminDashboardService, AdminDashboardService>();
        services.AddScoped<IRegistrationManagementService, RegistrationManagementService>();
        services.AddScoped<ITaskManagementService, TaskManagementService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddTransient<IEmailService, SmtpEmailService>();
        services.AddScoped<DevelopmentAdminSeeder>();

        return services;
    }

    public static IServiceCollection AddOpenApiDocumentation(this IServiceCollection services)
    {
        services.AddOpenApi(options =>
        {
            options.AddDocumentTransformer<BearerSecuritySchemeTransformer>();
            options.AddOperationTransformer<BearerSecuritySchemeTransformer>();
        });

        return services;
    }
}
