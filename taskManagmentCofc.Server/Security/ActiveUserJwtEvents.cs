using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using taskManagmentCofc.Server.Data;
using taskManagmentCofc.Server.Enums;

namespace taskManagmentCofc.Server.Security;

public sealed class ActiveUserJwtEvents(AppDbContext dbContext) : JwtBearerEvents
{
    public override async Task TokenValidated(TokenValidatedContext context)
    {
        var endpoint = context.HttpContext.GetEndpoint();
        var allowsAnonymous = endpoint?.Metadata.GetMetadata<IAllowAnonymous>() is not null;
        var requiresAuthorization =
            endpoint?.Metadata.GetOrderedMetadata<IAuthorizeData>().Count > 0;

        if (!requiresAuthorization || allowsAnonymous)
        {
            return;
        }

        // يمنع هذا الفحص مستخدمًا تغيّرت حالته بعد إصدار JWT من الاستمرار باستخدام Token قديم.
        if (context.Principal is null ||
            !context.Principal.TryGetUserId(out var userId) ||
            !context.Principal.TryGetUserRole(out var role))
        {
            context.Fail("Invalid user identifier.");
            return;
        }

        var isActiveUser = await dbContext.Users
            .AsNoTracking()
            .AnyAsync(
                user => user.Id == userId &&
                    user.Status == UserStatus.Active &&
                    user.Role == role,
                context.HttpContext.RequestAborted);

        if (!isActiveUser)
        {
            // تُبطل الجلسة ويعيد نظام Bearer استجابة 401 بشكل موحد.
            context.Fail("The user account is no longer valid.");
        }
    }
}
