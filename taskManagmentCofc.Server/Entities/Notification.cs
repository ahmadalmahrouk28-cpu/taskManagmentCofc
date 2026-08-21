using taskManagmentCofc.Server.Common;

namespace taskManagmentCofc.Server.Entities;

public sealed class Notification : ICreationTrackedEntity
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public User User { get; set; } = null!;

    public string Message { get; set; } = string.Empty;

    public bool IsRead { get; set; }

    public DateTime CreatedAtUtc { get; set; }
}
