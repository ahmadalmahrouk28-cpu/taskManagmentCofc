using taskManagmentCofc.Server.Common;
using taskManagmentCofc.Server.Enums;

namespace taskManagmentCofc.Server.Entities;

public sealed class User : IAuditableEntity
{
    public Guid Id { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string NormalizedEmail { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    // التسجيل الذاتي يبقى Employee/Pending حتى يفعّله المسؤول.
    public UserRole Role { get; set; } = UserRole.Employee;

    public UserStatus Status { get; set; } = UserStatus.Pending;

    public string? RejectionReason { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public DateTime UpdatedAtUtc { get; set; }

    public ICollection<TaskItem> AssignedTasks { get; set; } = [];

    public ICollection<TaskItem> CreatedTasks { get; set; } = [];

    public ICollection<Notification> Notifications { get; set; } = [];
}
