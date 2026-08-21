namespace taskManagmentCofc.Server.Common;

public interface IAuditableEntity : ICreationTrackedEntity
{
    DateTime UpdatedAtUtc { get; set; }
}
