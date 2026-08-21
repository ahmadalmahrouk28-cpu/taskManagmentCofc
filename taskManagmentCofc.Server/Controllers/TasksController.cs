using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using taskManagmentCofc.Server.DTOs.Common;
using taskManagmentCofc.Server.DTOs.Tasks;
using taskManagmentCofc.Server.Enums;
using taskManagmentCofc.Server.Security;
using taskManagmentCofc.Server.Services;
using taskManagmentCofc.Server.Services.Interfaces;

namespace taskManagmentCofc.Server.Controllers;

[ApiController]
[Authorize]
[Route("api/tasks")]
public sealed class TasksController(ITaskManagementService taskManagementService) : ControllerBase
{
    [Authorize(Roles = nameof(UserRole.Admin))]
    [HttpPost]
    [ProducesResponseType(typeof(TaskDetailsDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Create(
        CreateTaskRequest request,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var currentAdminId))
        {
            return InvalidIdentity();
        }

        var result = await taskManagementService.CreateAsync(
            request,
            currentAdminId,
            cancellationToken);

        return result.Type == TaskManagementResultType.Success
            ? CreatedAtAction(nameof(GetById), new { id = result.Task!.Id }, result.Task)
            : MapError(result.Type);
    }

    [HttpGet]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    [ProducesResponseType(typeof(IReadOnlyList<TaskListItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<IReadOnlyList<TaskListItemDto>>> GetAll(
        [FromQuery] string? search,
        [FromQuery] TaskItemStatus? status,
        [FromQuery] Guid? assignedToUserId,
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentIdentity(out var currentUserId, out var currentUserRole))
        {
            return InvalidIdentity();
        }

        if (status.HasValue && !Enum.IsDefined(status.Value))
        {
            return BadRequest(new ApiErrorResponse(
                "INVALID_STATUS",
                "The task status filter is invalid."));
        }

        if (currentUserRole == UserRole.Employee && assignedToUserId.HasValue)
        {
            return Forbid();
        }

        var tasks = await taskManagementService.GetAllAsync(
            currentUserId,
            currentUserRole,
            search,
            status,
            assignedToUserId,
            cancellationToken);

        return Ok(tasks);
    }

    [HttpGet("{id:guid}")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    [ProducesResponseType(typeof(TaskDetailsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<TaskDetailsDto>> GetById(
        Guid id,
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentIdentity(out var currentUserId, out var currentUserRole))
        {
            return InvalidIdentity();
        }

        var task = await taskManagementService.GetByIdAsync(
            id,
            currentUserId,
            currentUserRole,
            cancellationToken);

        return task is null
            ? NotFound(new ApiErrorResponse("TASK_NOT_FOUND", "The requested task does not exist."))
            : Ok(task);
    }

    [Authorize(Roles = nameof(UserRole.Admin))]
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(TaskDetailsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Update(
        Guid id,
        UpdateTaskRequest request,
        CancellationToken cancellationToken)
    {
        var result = await taskManagementService.UpdateAsync(id, request, cancellationToken);

        return result.Type == TaskManagementResultType.Success
            ? Ok(result.Task)
            : MapError(result.Type);
    }

    [Authorize(Roles = nameof(UserRole.Admin))]
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Delete(
        Guid id,
        CancellationToken cancellationToken)
    {
        var result = await taskManagementService.DeleteAsync(id, cancellationToken);

        return result.Type == TaskManagementResultType.Success
            ? NoContent()
            : MapError(result.Type);
    }

    [HttpPatch("{id:guid}/status")]
    [ProducesResponseType(typeof(TaskDetailsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpdateStatus(
        Guid id,
        UpdateTaskStatusRequest request,
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentIdentity(out var currentUserId, out var currentUserRole))
        {
            return InvalidIdentity();
        }

        var result = await taskManagementService.UpdateStatusAsync(
            id,
            request,
            currentUserId,
            currentUserRole,
            cancellationToken);

        return result.Type == TaskManagementResultType.Success
            ? Ok(result.Task)
            : MapError(result.Type);
    }

    private bool TryGetCurrentIdentity(out Guid userId, out UserRole role)
    {
        role = default;
        return User.TryGetUserId(out userId) && User.TryGetUserRole(out role);
    }

    private UnauthorizedObjectResult InvalidIdentity()
    {
        return Unauthorized(new ApiErrorResponse(
            "INVALID_TOKEN",
            "The access token does not contain a valid user identity."));
    }

    private IActionResult MapError(TaskManagementResultType resultType)
    {
        return resultType switch
        {
            TaskManagementResultType.TaskNotFound => NotFound(new ApiErrorResponse(
                "TASK_NOT_FOUND",
                "The requested task does not exist.")),
            TaskManagementResultType.AssigneeNotFound => BadRequest(new ApiErrorResponse(
                "ASSIGNEE_NOT_FOUND",
                "The selected assignee does not exist.")),
            TaskManagementResultType.AssigneeNotEmployee => BadRequest(new ApiErrorResponse(
                "ASSIGNEE_NOT_EMPLOYEE",
                "Tasks can only be assigned to employees.")),
            TaskManagementResultType.AssigneeNotActive => BadRequest(new ApiErrorResponse(
                "ASSIGNEE_NOT_ACTIVE",
                "Tasks can only be assigned to active employees.")),
            TaskManagementResultType.InvalidStatus => BadRequest(new ApiErrorResponse(
                "INVALID_STATUS",
                "The task status is invalid.")),
            TaskManagementResultType.EmployeeStatusNotAllowed => BadRequest(new ApiErrorResponse(
                "STATUS_NOT_ALLOWED",
                "Employees can only set a task status to InProgress or Completed.")),
            _ => throw new InvalidOperationException("Unsupported task management result.")
        };
    }
}
