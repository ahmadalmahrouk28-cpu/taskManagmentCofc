using System.ComponentModel.DataAnnotations;

namespace taskManagmentCofc.Server.DTOs.Tasks;

public sealed class CreateTaskRequest
{
    [Required]
    [StringLength(200)]
    public string Title { get; init; } = string.Empty;

    [Required]
    [StringLength(4000)]
    public string Description { get; init; } = string.Empty;

    [Required]
    public Guid? AssignedToUserId { get; init; }
}
