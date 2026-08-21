using Microsoft.AspNetCore.Diagnostics;
using taskManagmentCofc.Server.DTOs.Common;

namespace taskManagmentCofc.Server.Middleware;

public sealed class GlobalExceptionHandler(
    ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var traceId = httpContext.TraceIdentifier;

        // لا تُسجّل الرسالة الخام لتجنب تسريب أسرار قاعدة البيانات أو الإعدادات.
        logger.LogError(
            "Unhandled exception. Type: {ExceptionType}; TraceId: {TraceId}",
            exception.GetType().Name,
            traceId);

        httpContext.Response.StatusCode = StatusCodes.Status500InternalServerError;
        await httpContext.Response.WriteAsJsonAsync(
            new ApiErrorResponse(
                "UNEXPECTED_ERROR",
                "An unexpected error occurred.",
                TraceId: traceId),
            cancellationToken);

        return true;
    }
}
