using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using taskManagmentCofc.Server.Enums;

namespace taskManagmentCofc.Server.Security;

public static class ClaimsPrincipalExtensions
{
    public static bool TryGetUserId(this ClaimsPrincipal principal, out Guid userId)
    {
        // هوية المستخدم تؤخذ من JWT الموثق ولا تُقبل من مدخلات العميل.
        var subject = principal.FindFirstValue(JwtRegisteredClaimNames.Sub);
        return Guid.TryParse(subject, out userId);
    }

    public static bool TryGetUserRole(this ClaimsPrincipal principal, out UserRole role)
    {
        var roleClaim = principal.FindFirstValue("role");
        return Enum.TryParse(roleClaim, ignoreCase: false, out role) && Enum.IsDefined(role);
    }
}
