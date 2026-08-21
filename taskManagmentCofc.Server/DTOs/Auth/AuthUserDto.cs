using taskManagmentCofc.Server.Enums;

namespace taskManagmentCofc.Server.DTOs.Auth;

public sealed record AuthUserDto(
    Guid Id,
    string FullName,
    string Email,
    UserRole Role,
    UserStatus Status);
