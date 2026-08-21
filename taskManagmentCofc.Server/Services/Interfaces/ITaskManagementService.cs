using taskManagmentCofc.Server.DTOs.Tasks;
using taskManagmentCofc.Server.Enums;

namespace taskManagmentCofc.Server.Services.Interfaces;

public interface ITaskManagementService
{
    Task<TaskManagementResult> CreateAsync(
        CreateTaskRequest request,
        Guid currentAdminId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<TaskListItemDto>> GetAllAsync(
        Guid currentUserId,
        UserRole currentUserRole,
        string? search,
        TaskItemStatus? status,
        Guid? assignedToUserId,
        CancellationToken cancellationToken = default);

    Task<TaskDetailsDto?> GetByIdAsync(
        Guid taskId,
        Guid currentUserId,
        UserRole currentUserRole,
        CancellationToken cancellationToken = default);

    Task<TaskManagementResult> UpdateAsync(
        Guid taskId,
        UpdateTaskRequest request,
        CancellationToken cancellationToken = default);

    Task<TaskManagementResult> DeleteAsync(
        Guid taskId,
        CancellationToken cancellationToken = default);

    Task<TaskManagementResult> UpdateStatusAsync(
        Guid taskId,
        UpdateTaskStatusRequest request,
        Guid currentUserId,
        UserRole currentUserRole,
        CancellationToken cancellationToken = default);
}
