using System.ComponentModel.DataAnnotations;

namespace taskManagmentCofc.Server.DTOs.Users;

public sealed class RejectRegistrationRequest : IValidatableObject
{
    [Required]
    [StringLength(1000)]
    public string Reason { get; init; } = string.Empty;

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (string.IsNullOrWhiteSpace(Reason))
        {
            yield return new ValidationResult(
                "Rejection reason is required.",
                [nameof(Reason)]);
        }
    }
}
