using taskManagmentCofc.Server.DTOs.Auth;

namespace taskManagmentCofc.Server.Services;

public enum RegistrationResult
{
    Success,
    DuplicateEmail,
    PasswordMismatch
}

public enum LoginResultType
{
    Success,
    InvalidCredentials,
    AccountPending,
    AccountRejected
}

public sealed record LoginResult(
    LoginResultType Type,
    AuthResponse? Response = null,
    string? RejectionReason = null);
