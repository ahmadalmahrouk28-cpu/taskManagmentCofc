using taskManagmentCofc.Server.Common;
using taskManagmentCofc.Server.Enums;

namespace taskManagmentCofc.Server.Entities;

public sealed class TaskItem : IAuditableEntity
{
    public Guid Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public TaskItemStatus Status { get; set; } = TaskItemStatus.Pending;

    public Guid? AssignedToUserId { get; set; }

    public User? AssignedToUser { get; set; }

    public Guid CreatedByUserId { get; set; }

    public User CreatedByUser { get; set; } = null!;

    public DateTime CreatedAtUtc { get; set; }

    public DateTime UpdatedAtUtc { get; set; }
}
