using Microsoft.EntityFrameworkCore;
using taskManagmentCofc.Server.Data;
using taskManagmentCofc.Server.DTOs.Dashboard;
using taskManagmentCofc.Server.Enums;
using taskManagmentCofc.Server.Services.Interfaces;

namespace taskManagmentCofc.Server.Services.Implementations;

public sealed class AdminDashboardService(AppDbContext dbContext) : IAdminDashboardService
{
    public async Task<AdminDashboardDto> GetAsync(
        CancellationToken cancellationToken = default)
    {
        var totalUsers = await dbContext.Users.CountAsync(cancellationToken);
        var totalEmployees = await dbContext.Users.CountAsync(
            user => user.Role == UserRole.Employee,
            cancellationToken);
        var activeEmployees = await dbContext.Users.CountAsync(
            user => user.Role == UserRole.Employee && user.Status == UserStatus.Active,
            cancellationToken);
        var pendingRegistrations = await dbContext.Users.CountAsync(
            user => user.Role == UserRole.Employee && user.Status == UserStatus.Pending,
            cancellationToken);
        var rejectedUsers = await dbContext.Users.CountAsync(
            user => user.Status == UserStatus.Rejected,
            cancellationToken);

        var totalTasks = await dbContext.TaskItems.CountAsync(cancellationToken);
        var pendingTasks = await dbContext.TaskItems.CountAsync(
            taskItem => taskItem.Status == TaskItemStatus.Pending,
            cancellationToken);
        var inProgressTasks = await dbContext.TaskItems.CountAsync(
            taskItem => taskItem.Status == TaskItemStatus.InProgress,
            cancellationToken);
        var completedTasks = await dbContext.TaskItems.CountAsync(
            taskItem => taskItem.Status == TaskItemStatus.Completed,
            cancellationToken);

        return new AdminDashboardDto(
            totalUsers,
            totalEmployees,
            activeEmployees,
            pendingRegistrations,
            rejectedUsers,
            totalTasks,
            pendingTasks,
            inProgressTasks,
            completedTasks);
    }

    public async Task<IReadOnlyList<EmployeeTaskStatisticsDto>> GetEmployeeTaskStatisticsAsync(
        CancellationToken cancellationToken = default)
    {
        return await dbContext.Users
            .AsNoTracking()
            .Where(user => user.Role == UserRole.Employee)
            .OrderBy(user => user.FullName)
            .Select(user => new EmployeeTaskStatisticsDto(
                user.Id,
                user.FullName,
                user.Email,
                user.AssignedTasks.Count,
                user.AssignedTasks.Count(taskItem => taskItem.Status == TaskItemStatus.Pending),
                user.AssignedTasks.Count(taskItem => taskItem.Status == TaskItemStatus.InProgress),
                user.AssignedTasks.Count(taskItem => taskItem.Status == TaskItemStatus.Completed)))
            .ToListAsync(cancellationToken);
    }
}
