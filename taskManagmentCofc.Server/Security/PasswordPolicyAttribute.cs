using System.ComponentModel.DataAnnotations;

namespace taskManagmentCofc.Server.Security;

[AttributeUsage(AttributeTargets.Property | AttributeTargets.Parameter)]
public sealed class PasswordPolicyAttribute : ValidationAttribute
{
    public PasswordPolicyAttribute()
        : base("Password must be at least 8 characters and contain a letter and a number.")
    {
    }

    public override bool IsValid(object? value)
    {
        if (value is null)
        {
            return true;
        }

        return value is string password &&
            password.Length >= 8 &&
            password.Any(char.IsLetter) &&
            password.Any(char.IsDigit);
    }
}
