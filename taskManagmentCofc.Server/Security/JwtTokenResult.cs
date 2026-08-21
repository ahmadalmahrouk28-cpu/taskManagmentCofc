namespace taskManagmentCofc.Server.Security;

public sealed record JwtTokenResult(string AccessToken, DateTime ExpiresAtUtc);
