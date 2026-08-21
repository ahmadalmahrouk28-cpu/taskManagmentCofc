using taskManagmentCofc.Server.Enums;

namespace taskManagmentCofc.Server.DTOs.Users;

public sealed record AdminUserDto(
    Guid Id,
    string FullName,
    string Email,
    UserRole Role,
    UserStatus Status,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc);
