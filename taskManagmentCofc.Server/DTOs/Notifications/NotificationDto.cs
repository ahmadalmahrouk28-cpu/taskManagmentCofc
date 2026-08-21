namespace taskManagmentCofc.Server.DTOs.Notifications;

public sealed record NotificationDto(
    Guid Id,
    string Message,
    bool IsRead,
    DateTime CreatedAtUtc);
