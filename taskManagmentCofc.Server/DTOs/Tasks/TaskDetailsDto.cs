using taskManagmentCofc.Server.Enums;

namespace taskManagmentCofc.Server.DTOs.Tasks;

public sealed record TaskDetailsDto(
    Guid Id,
    string Title,
    string Description,
    TaskItemStatus Status,
    TaskAssigneeDto? AssignedTo,
    TaskCreatorDto CreatedBy,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc);
