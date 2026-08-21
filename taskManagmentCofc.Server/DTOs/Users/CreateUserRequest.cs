using System.ComponentModel.DataAnnotations;
using taskManagmentCofc.Server.Enums;
using taskManagmentCofc.Server.Security;

namespace taskManagmentCofc.Server.DTOs.Users;

public sealed class CreateUserRequest
{
    [Required]
    [StringLength(150)]
    public string FullName { get; init; } = string.Empty;

    [Required]
    [EmailAddress]
    [StringLength(256)]
    public string Email { get; init; } = string.Empty;

    [Required]
    [StringLength(128, MinimumLength = 8)]
    [PasswordPolicy]
    public string Password { get; init; } = string.Empty;

    [Required]
    [Compare(nameof(Password))]
    [StringLength(128)]
    public string ConfirmPassword { get; init; } = string.Empty;

    [Required]
    [EnumDataType(typeof(UserRole))]
    public UserRole? Role { get; init; }
}
