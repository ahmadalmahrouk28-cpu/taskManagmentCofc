using taskManagmentCofc.Server.Enums;

namespace taskManagmentCofc.Server.DTOs.Users;

public sealed record PendingRegistrationDto(
    Guid Id,
    string FullName,
    string Email,
    UserStatus Status,
    DateTime CreatedAtUtc);
