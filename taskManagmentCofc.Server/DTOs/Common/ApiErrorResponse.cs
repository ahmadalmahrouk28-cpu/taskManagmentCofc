namespace taskManagmentCofc.Server.DTOs.Common;

public sealed record ApiErrorResponse(
    string Code,
    string Message,
    string? Reason = null,
    IReadOnlyDictionary<string, string[]>? Errors = null,
    string? TraceId = null);
