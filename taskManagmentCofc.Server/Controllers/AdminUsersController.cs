using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using taskManagmentCofc.Server.DTOs.Common;
using taskManagmentCofc.Server.DTOs.Users;
using taskManagmentCofc.Server.Enums;
using taskManagmentCofc.Server.Security;
using taskManagmentCofc.Server.Services;
using taskManagmentCofc.Server.Services.Interfaces;

namespace taskManagmentCofc.Server.Controllers;

[ApiController]
[Authorize(Roles = nameof(UserRole.Admin))]
[Route("api/admin/users")]
public sealed class AdminUsersController(IAdminUserService adminUserService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<AdminUserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<IReadOnlyList<AdminUserDto>>> GetAll(
        [FromQuery] string? search,
        [FromQuery] UserRole? role,
        [FromQuery] UserStatus? status,
        CancellationToken cancellationToken)
    {
        if (role.HasValue && !Enum.IsDefined(role.Value))
        {
            return BadRequest(new ApiErrorResponse("INVALID_ROLE", "The role filter is invalid."));
        }

        if (status.HasValue && !Enum.IsDefined(status.Value))
        {
            return BadRequest(new ApiErrorResponse("INVALID_STATUS", "The status filter is invalid."));
        }

        var users = await adminUserService.GetAllAsync(search, role, status, cancellationToken);
        return Ok(users);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(AdminUserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<AdminUserDto>> GetById(
        Guid id,
        CancellationToken cancellationToken)
    {
        var user = await adminUserService.GetByIdAsync(id, cancellationToken);

        return user is null
            ? NotFound(new ApiErrorResponse("USER_NOT_FOUND", "The requested user does not exist."))
            : Ok(user);
    }

    [HttpPost]
    [ProducesResponseType(typeof(AdminUserDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Create(
        CreateUserRequest request,
        CancellationToken cancellationToken)
    {
        var result = await adminUserService.CreateAsync(request, cancellationToken);

        if (result.Type == AdminUserManagementResultType.Success)
        {
            return CreatedAtAction(
                nameof(GetById),
                new { id = result.User!.Id },
                result.User);
        }

        return MapError(result.Type);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(AdminUserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Update(
        Guid id,
        UpdateUserRequest request,
        CancellationToken cancellationToken)
    {
        var result = await adminUserService.UpdateAsync(id, request, cancellationToken);

        return result.Type == AdminUserManagementResultType.Success
            ? Ok(result.User)
            : MapError(result.Type);
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Delete(
        Guid id,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var currentUserId))
        {
            return Unauthorized(new ApiErrorResponse(
                "INVALID_TOKEN",
                "The access token does not contain a valid user identifier."));
        }

        var result = await adminUserService.DeleteAsync(id, currentUserId, cancellationToken);

        return result.Type == AdminUserManagementResultType.Success
            ? NoContent()
            : MapError(result.Type);
    }

    private IActionResult MapError(AdminUserManagementResultType resultType)
    {
        return resultType switch
        {
            AdminUserManagementResultType.UserNotFound => NotFound(new ApiErrorResponse(
                "USER_NOT_FOUND",
                "The requested user does not exist.")),
            AdminUserManagementResultType.DuplicateEmail => Conflict(new ApiErrorResponse(
                "EMAIL_ALREADY_EXISTS",
                "An account with this email already exists.")),
            AdminUserManagementResultType.PasswordMismatch => BadRequest(new ApiErrorResponse(
                "PASSWORD_MISMATCH",
                "Password and confirmation password do not match.")),
            AdminUserManagementResultType.InvalidRole => BadRequest(new ApiErrorResponse(
                "INVALID_ROLE",
                "Role must be Admin or Employee.")),
            AdminUserManagementResultType.CannotDeleteCurrentUser => Conflict(new ApiErrorResponse(
                "CANNOT_DELETE_CURRENT_USER",
                "Administrators cannot delete their own account from the current session.")),
            AdminUserManagementResultType.LastActiveAdmin => Conflict(new ApiErrorResponse(
                "LAST_ACTIVE_ADMIN_REQUIRED",
                "The last active administrator cannot be deleted or demoted.")),
            AdminUserManagementResultType.UserHasCreatedTasks => Conflict(new ApiErrorResponse(
                "USER_HAS_CREATED_TASKS",
                "The user cannot be deleted because they are the recorded creator of existing tasks.")),
            _ => throw new InvalidOperationException("Unsupported admin user management result.")
        };
    }
}
