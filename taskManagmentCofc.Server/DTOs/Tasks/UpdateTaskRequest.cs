using System.ComponentModel.DataAnnotations;
using taskManagmentCofc.Server.Enums;

namespace taskManagmentCofc.Server.DTOs.Tasks;

public sealed class UpdateTaskRequest
{
    [Required]
    [StringLength(200)]
    public string Title { get; init; } = string.Empty;

    [Required]
    [StringLength(4000)]
    public string Description { get; init; } = string.Empty;

    [Required]
    public Guid? AssignedToUserId { get; init; }

    [Required]
    [EnumDataType(typeof(TaskItemStatus))]
    public TaskItemStatus? Status { get; init; }
}
