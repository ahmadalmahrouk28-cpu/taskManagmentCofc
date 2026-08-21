namespace taskManagmentCofc.Server.DTOs.Auth;

public sealed record AuthResponse(
    string AccessToken,
    DateTime ExpiresAtUtc,
    AuthUserDto User);
