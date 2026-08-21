using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using taskManagmentCofc.Server.DTOs.Auth;
using taskManagmentCofc.Server.DTOs.Common;
using taskManagmentCofc.Server.Security;
using taskManagmentCofc.Server.Services;
using taskManagmentCofc.Server.Services.Interfaces;

namespace taskManagmentCofc.Server.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(IAuthService authService) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("register")]
    [ProducesResponseType(typeof(MessageResponse), StatusCodes.Status202Accepted)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Register(
        RegisterRequest request,
        CancellationToken cancellationToken)
    {
        var result = await authService.RegisterAsync(request, cancellationToken);

        return result switch
        {
            RegistrationResult.Success => Accepted(new MessageResponse(
                "Registration submitted. Your account is awaiting administrator approval.")),
            RegistrationResult.DuplicateEmail => Conflict(new ApiErrorResponse(
                "EMAIL_ALREADY_EXISTS",
                "An account with this email already exists.")),
            RegistrationResult.PasswordMismatch => BadRequest(new ApiErrorResponse(
                "PASSWORD_MISMATCH",
                "Password and confirmation password do not match.")),
            _ => throw new InvalidOperationException("Unsupported registration result.")
        };
    }

    [AllowAnonymous]
    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Login(
        LoginRequest request,
        CancellationToken cancellationToken)
    {
        var result = await authService.LoginAsync(request, cancellationToken);

        return result.Type switch
        {
            LoginResultType.Success => Ok(result.Response),
            LoginResultType.InvalidCredentials => Unauthorized(new ApiErrorResponse(
                "INVALID_CREDENTIALS",
                "Invalid email or password.")),
            LoginResultType.AccountPending => StatusCode(
                StatusCodes.Status403Forbidden,
                new ApiErrorResponse(
                    "ACCOUNT_PENDING",
                    "Your account is awaiting administrator approval.")),
            LoginResultType.AccountRejected => StatusCode(
                StatusCodes.Status403Forbidden,
                new ApiErrorResponse(
                    "ACCOUNT_REJECTED",
                    "Your account registration was rejected.",
                    result.RejectionReason)),
            _ => throw new InvalidOperationException("Unsupported login result.")
        };
    }

    [Authorize]
    [HttpGet("me")]
    [ProducesResponseType(typeof(AuthUserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Me(CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var userId))
        {
            return Unauthorized(new ApiErrorResponse(
                "INVALID_TOKEN",
                "The access token does not contain a valid user identifier."));
        }

        var currentUser = await authService.GetCurrentUserAsync(userId, cancellationToken);

        return currentUser is null
            ? Unauthorized(new ApiErrorResponse(
                "INVALID_TOKEN",
                "The user associated with this access token no longer exists."))
            : Ok(currentUser);
    }
}
