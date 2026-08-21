using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using taskManagmentCofc.Server.DTOs.Common;
using taskManagmentCofc.Server.DTOs.Notifications;
using taskManagmentCofc.Server.Security;
using taskManagmentCofc.Server.Services.Interfaces;

namespace taskManagmentCofc.Server.Controllers;

[ApiController]
[Authorize]
[Route("api/notifications")]
public sealed class NotificationsController(
    INotificationService notificationService) : ControllerBase
{
    [HttpGet]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    [ProducesResponseType(typeof(IReadOnlyList<NotificationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<IReadOnlyList<NotificationDto>>> GetAll(
        CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var currentUserId))
        {
            return InvalidIdentity();
        }

        return Ok(await notificationService.GetForUserAsync(
            currentUserId,
            cancellationToken));
    }

    [HttpPatch("{id:guid}/read")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> MarkAsRead(
        Guid id,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var currentUserId))
        {
            return InvalidIdentity();
        }

        var wasUpdated = await notificationService.MarkAsReadAsync(
            id,
            currentUserId,
            cancellationToken);

        return wasUpdated
            ? NoContent()
            : NotFound(new ApiErrorResponse(
                "NOTIFICATION_NOT_FOUND",
                "The requested notification does not exist."));
    }

    private UnauthorizedObjectResult InvalidIdentity()
    {
        return Unauthorized(new ApiErrorResponse(
            "INVALID_TOKEN",
            "The access token does not contain a valid user identity."));
    }
}
