using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using taskManagmentCofc.Server.Data;
using taskManagmentCofc.Server.DTOs.Tasks;
using taskManagmentCofc.Server.Entities;
using taskManagmentCofc.Server.Enums;
using taskManagmentCofc.Server.Services.Interfaces;

namespace taskManagmentCofc.Server.Services.Implementations;

public sealed class TaskManagementService(AppDbContext dbContext) : ITaskManagementService
{
    public async Task<TaskManagementResult> CreateAsync(
        CreateTaskRequest request,
        Guid currentAdminId,
        CancellationToken cancellationToken = default)
    {
        if (!request.AssignedToUserId.HasValue)
        {
            return new(TaskManagementResultType.AssigneeNotFound);
        }

        var assigneeValidation = await ValidateAssigneeAsync(
            request.AssignedToUserId.Value,
            cancellationToken);

        if (assigneeValidation != TaskManagementResultType.Success)
        {
            return new(assigneeValidation);
        }

        var taskItem = new TaskItem
        {
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            Status = TaskItemStatus.Pending,
            AssignedToUserId = request.AssignedToUserId.Value,
            // منشئ المهمة يؤخذ من هوية المسؤول الموثقة ولا يُقبل من العميل.
            CreatedByUserId = currentAdminId
        };
        dbContext.TaskItems.Add(taskItem);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new(
            TaskManagementResultType.Success,
            await GetDetailsWithoutOwnershipAsync(taskItem.Id, cancellationToken));
    }

    public async Task<IReadOnlyList<TaskListItemDto>> GetAllAsync(
        Guid currentUserId,
        UserRole currentUserRole,
        string? search,
        TaskItemStatus? status,
        Guid? assignedToUserId,
        CancellationToken cancellationToken = default)
    {
        var query = dbContext.TaskItems.AsNoTracking();

        if (currentUserRole == UserRole.Employee)
        {
            query = query.Where(taskItem => taskItem.AssignedToUserId == currentUserId);
        }
        else if (currentUserRole == UserRole.Admin && assignedToUserId.HasValue)
        {
            query = query.Where(taskItem => taskItem.AssignedToUserId == assignedToUserId.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchTerm = search.Trim();
            query = query.Where(taskItem =>
                taskItem.Title.Contains(searchTerm) ||
                taskItem.Description.Contains(searchTerm));
        }

        if (status.HasValue)
        {
            query = query.Where(taskItem => taskItem.Status == status.Value);
        }

        return await query
            .OrderByDescending(taskItem => taskItem.CreatedAtUtc)
            .Select(ListProjection())
            .ToListAsync(cancellationToken);
    }

    public Task<TaskDetailsDto?> GetByIdAsync(
        Guid taskId,
        Guid currentUserId,
        UserRole currentUserRole,
        CancellationToken cancellationToken = default)
    {
        var query = dbContext.TaskItems.AsNoTracking().Where(taskItem => taskItem.Id == taskId);

        if (currentUserRole == UserRole.Employee)
        {
            // شرط الملكية داخل الاستعلام يمنع IDOR عبر تغيير معرّف المهمة يدويًا.
            query = query.Where(taskItem => taskItem.AssignedToUserId == currentUserId);
        }

        return query
            .Select(DetailsProjection())
            .SingleOrDefaultAsync(cancellationToken);
    }

    public async Task<TaskManagementResult> UpdateAsync(
        Guid taskId,
        UpdateTaskRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!request.Status.HasValue || !Enum.IsDefined(request.Status.Value))
        {
            return new(TaskManagementResultType.InvalidStatus);
        }

        if (!request.AssignedToUserId.HasValue)
        {
            return new(TaskManagementResultType.AssigneeNotFound);
        }

        var assigneeValidation = await ValidateAssigneeAsync(
            request.AssignedToUserId.Value,
            cancellationToken);

        if (assigneeValidation != TaskManagementResultType.Success)
        {
            return new(assigneeValidation);
        }

        var title = request.Title.Trim();
        var description = request.Description.Trim();
        var assignedToUserId = request.AssignedToUserId.Value;
        var status = request.Status.Value;
        var updatedAtUtc = DateTime.UtcNow;

        // التحديث الذري يضمن تطبيق الحالة المطلوبة مع إعادة الإسناد دون فجوة زمنية يستغلها مالك سابق.
        var updatedRows = await dbContext.TaskItems
            .Where(taskItem => taskItem.Id == taskId)
            .ExecuteUpdateAsync(
                setters => setters
                    .SetProperty(taskItem => taskItem.Title, title)
                    .SetProperty(taskItem => taskItem.Description, description)
                    .SetProperty(taskItem => taskItem.AssignedToUserId, assignedToUserId)
                    .SetProperty(taskItem => taskItem.Status, status)
                    .SetProperty(taskItem => taskItem.UpdatedAtUtc, updatedAtUtc),
                cancellationToken);

        if (updatedRows == 0)
        {
            return new(TaskManagementResultType.TaskNotFound);
        }

        return new(
            TaskManagementResultType.Success,
            await GetDetailsWithoutOwnershipAsync(taskId, cancellationToken));
    }

    public async Task<TaskManagementResult> DeleteAsync(
        Guid taskId,
        CancellationToken cancellationToken = default)
    {
        var taskItem = await dbContext.TaskItems.SingleOrDefaultAsync(
            taskItem => taskItem.Id == taskId,
            cancellationToken);

        if (taskItem is null)
        {
            return new(TaskManagementResultType.TaskNotFound);
        }

        dbContext.TaskItems.Remove(taskItem);
        await dbContext.SaveChangesAsync(cancellationToken);
        return new(TaskManagementResultType.Success);
    }

    public async Task<TaskManagementResult> UpdateStatusAsync(
        Guid taskId,
        UpdateTaskStatusRequest request,
        Guid currentUserId,
        UserRole currentUserRole,
        CancellationToken cancellationToken = default)
    {
        if (!request.Status.HasValue || !Enum.IsDefined(request.Status.Value))
        {
            return new(TaskManagementResultType.InvalidStatus);
        }

        var status = request.Status.Value;
        var query = dbContext.TaskItems.Where(taskItem => taskItem.Id == taskId);

        if (currentUserRole == UserRole.Employee)
        {
            query = query.Where(taskItem => taskItem.AssignedToUserId == currentUserId);
        }

        if (currentUserRole == UserRole.Employee && status == TaskItemStatus.Pending)
        {
            return await query.AsNoTracking().AnyAsync(cancellationToken)
                ? new(TaskManagementResultType.EmployeeStatusNotAllowed)
                : new(TaskManagementResultType.TaskNotFound);
        }

        var updatedAtUtc = DateTime.UtcNow;

        // التحديث المشروط بالمالك يمنع تغيير الحالة إذا أُعيد إسناد المهمة أثناء الطلب.
        var updatedRows = await query.ExecuteUpdateAsync(
            setters => setters
                .SetProperty(taskItem => taskItem.Status, status)
                .SetProperty(taskItem => taskItem.UpdatedAtUtc, updatedAtUtc),
            cancellationToken);

        if (updatedRows == 0)
        {
            return new(TaskManagementResultType.TaskNotFound);
        }

        var details = currentUserRole == UserRole.Employee
            ? await GetByIdAsync(taskId, currentUserId, currentUserRole, cancellationToken)
            : await GetDetailsWithoutOwnershipAsync(taskId, cancellationToken);

        return details is null
            ? new(TaskManagementResultType.TaskNotFound)
            : new(TaskManagementResultType.Success, details);
    }

    private async Task<TaskManagementResultType> ValidateAssigneeAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var assignee = await dbContext.Users
            .AsNoTracking()
            .Where(user => user.Id == userId)
            .Select(user => new { user.Role, user.Status })
            .SingleOrDefaultAsync(cancellationToken);

        if (assignee is null)
        {
            return TaskManagementResultType.AssigneeNotFound;
        }

        if (assignee.Role != UserRole.Employee)
        {
            return TaskManagementResultType.AssigneeNotEmployee;
        }

        return assignee.Status == UserStatus.Active
            ? TaskManagementResultType.Success
            : TaskManagementResultType.AssigneeNotActive;
    }

    private Task<TaskDetailsDto?> GetDetailsWithoutOwnershipAsync(
        Guid taskId,
        CancellationToken cancellationToken)
    {
        return dbContext.TaskItems
            .AsNoTracking()
            .Where(taskItem => taskItem.Id == taskId)
            .Select(DetailsProjection())
            .SingleOrDefaultAsync(cancellationToken);
    }

    private static Expression<Func<TaskItem, TaskListItemDto>> ListProjection()
    {
        return taskItem => new TaskListItemDto(
            taskItem.Id,
            taskItem.Title,
            taskItem.Description,
            taskItem.Status,
            taskItem.AssignedToUser == null
                ? null
                : new TaskAssigneeDto(
                    taskItem.AssignedToUser.Id,
                    taskItem.AssignedToUser.FullName,
                    taskItem.AssignedToUser.Email),
            taskItem.CreatedAtUtc,
            taskItem.UpdatedAtUtc);
    }

    private static Expression<Func<TaskItem, TaskDetailsDto>> DetailsProjection()
    {
        return taskItem => new TaskDetailsDto(
            taskItem.Id,
            taskItem.Title,
            taskItem.Description,
            taskItem.Status,
            taskItem.AssignedToUser == null
                ? null
                : new TaskAssigneeDto(
                    taskItem.AssignedToUser.Id,
                    taskItem.AssignedToUser.FullName,
                    taskItem.AssignedToUser.Email),
            new TaskCreatorDto(
                taskItem.CreatedByUser.Id,
                taskItem.CreatedByUser.FullName),
            taskItem.CreatedAtUtc,
            taskItem.UpdatedAtUtc);
    }
}
