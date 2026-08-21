using taskManagmentCofc.Server.Enums;

namespace taskManagmentCofc.Server.DTOs.Tasks;

public sealed record TaskListItemDto(
    Guid Id,
    string Title,
    string Description,
    TaskItemStatus Status,
    TaskAssigneeDto? AssignedTo,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc);
