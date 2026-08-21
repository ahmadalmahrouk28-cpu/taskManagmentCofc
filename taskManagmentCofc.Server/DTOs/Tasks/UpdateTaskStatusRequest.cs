using System.ComponentModel.DataAnnotations;
using taskManagmentCofc.Server.Enums;

namespace taskManagmentCofc.Server.DTOs.Tasks;

public sealed class UpdateTaskStatusRequest
{
    [Required]
    [EnumDataType(typeof(TaskItemStatus))]
    public TaskItemStatus? Status { get; init; }
}
