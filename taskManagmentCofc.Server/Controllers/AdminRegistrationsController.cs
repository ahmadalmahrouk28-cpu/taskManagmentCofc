using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using taskManagmentCofc.Server.DTOs.Common;
using taskManagmentCofc.Server.DTOs.Users;
using taskManagmentCofc.Server.Enums;
using taskManagmentCofc.Server.Services;
using taskManagmentCofc.Server.Services.Interfaces;

namespace taskManagmentCofc.Server.Controllers;

[ApiController]
[Authorize(Roles = nameof(UserRole.Admin))]
[Route("api/admin/registrations")]
public sealed class AdminRegistrationsController(
    IRegistrationManagementService registrationManagementService) : ControllerBase
{
    [HttpGet("pending")]
    [ProducesResponseType(typeof(IReadOnlyList<PendingRegistrationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<IReadOnlyList<PendingRegistrationDto>>> GetPending(
        CancellationToken cancellationToken)
    {
        var registrations = await registrationManagementService.GetPendingAsync(cancellationToken);
        return Ok(registrations);
    }

    [HttpPost("{userId:guid}/approve")]
    [ProducesResponseType(typeof(MessageResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Approve(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var result = await registrationManagementService.ApproveAsync(userId, cancellationToken);

        return MapResult(
            result,
            "Registration approved successfully.");
    }

    [HttpPost("{userId:guid}/reject")]
    [ProducesResponseType(typeof(MessageResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Reject(
        Guid userId,
        RejectRegistrationRequest request,
        CancellationToken cancellationToken)
    {
        var result = await registrationManagementService.RejectAsync(
            userId,
            request.Reason,
            cancellationToken);

        return MapResult(
            result,
            "Registration rejected successfully.");
    }

    private IActionResult MapResult(
        RegistrationManagementResult result,
        string successMessage)
    {
        return result switch
        {
            RegistrationManagementResult.Success => Ok(new MessageResponse(successMessage)),
            RegistrationManagementResult.UserNotFound => NotFound(new ApiErrorResponse(
                "USER_NOT_FOUND",
                "The requested user does not exist.")),
            RegistrationManagementResult.UserNotEmployee => Conflict(new ApiErrorResponse(
                "INVALID_REGISTRATION_ROLE",
                "Only employee registration requests can be processed.")),
            RegistrationManagementResult.UserNotPending => Conflict(new ApiErrorResponse(
                "REGISTRATION_NOT_PENDING",
                "Only pending registration requests can be processed.")),
            _ => throw new InvalidOperationException("Unsupported registration management result.")
        };
    }
}
