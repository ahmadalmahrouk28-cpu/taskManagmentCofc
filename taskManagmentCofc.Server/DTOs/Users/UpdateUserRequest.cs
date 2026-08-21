using System.ComponentModel.DataAnnotations;
using taskManagmentCofc.Server.Enums;

namespace taskManagmentCofc.Server.DTOs.Users;

public sealed class UpdateUserRequest
{
    [Required]
    [StringLength(150)]
    public string FullName { get; init; } = string.Empty;

    [Required]
    [EmailAddress]
    [StringLength(256)]
    public string Email { get; init; } = string.Empty;

    [Required]
    [EnumDataType(typeof(UserRole))]
    public UserRole? Role { get; init; }
}
