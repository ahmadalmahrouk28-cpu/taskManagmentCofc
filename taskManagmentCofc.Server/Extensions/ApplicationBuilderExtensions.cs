using taskManagmentCofc.Server.Data;
using taskManagmentCofc.Server.DTOs.Common;
using Microsoft.EntityFrameworkCore;

namespace taskManagmentCofc.Server.Extensions;

public static class ApplicationBuilderExtensions
{
    public static async Task ApplyDatabaseMigrationsAsync(
        this WebApplication app,
        CancellationToken cancellationToken = default)
    {
        await using var scope = app.Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await dbContext.Database.MigrateAsync(cancellationToken);
    }

    public static async Task SeedDevelopmentAdminAsync(
        this WebApplication app,
        CancellationToken cancellationToken = default)
    {
        await using var scope = app.Services.CreateAsyncScope();
        var seeder = scope.ServiceProvider.GetRequiredService<DevelopmentAdminSeeder>();
        await seeder.SeedAsync(cancellationToken);
    }

    public static IApplicationBuilder UseApiErrorHandling(this IApplicationBuilder app)
    {
        app.UseExceptionHandler();
        app.UseStatusCodePages(async statusCodeContext =>
        {
            var httpContext = statusCodeContext.HttpContext;
            var (code, message) = MapStatusCode(httpContext.Response.StatusCode);

            await httpContext.Response.WriteAsJsonAsync(
                new ApiErrorResponse(
                    code,
                    message,
                    TraceId: httpContext.TraceIdentifier),
                httpContext.RequestAborted);
        });

        return app;
    }

    private static (string Code, string Message) MapStatusCode(int statusCode)
    {
        return statusCode switch
        {
            StatusCodes.Status400BadRequest => ("BAD_REQUEST", "The request is invalid."),
            StatusCodes.Status401Unauthorized => ("UNAUTHORIZED", "Authentication is required."),
            StatusCodes.Status403Forbidden => ("FORBIDDEN", "You are not authorized to perform this action."),
            StatusCodes.Status404NotFound => ("NOT_FOUND", "The requested resource was not found."),
            StatusCodes.Status409Conflict => ("CONFLICT", "The request conflicts with the current state."),
            StatusCodes.Status405MethodNotAllowed => ("METHOD_NOT_ALLOWED", "The HTTP method is not allowed."),
            StatusCodes.Status500InternalServerError => ("UNEXPECTED_ERROR", "An unexpected error occurred."),
            _ => ("HTTP_ERROR", "The request could not be completed.")
        };
    }
}
