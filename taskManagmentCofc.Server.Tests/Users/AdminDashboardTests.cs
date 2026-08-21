using System.Net;
using System.Net.Http.Json;
using taskManagmentCofc.Server.DTOs.Dashboard;
using taskManagmentCofc.Server.Enums;
using taskManagmentCofc.Server.Tests.Infrastructure;

namespace taskManagmentCofc.Server.Tests.Users;

public sealed class AdminDashboardTests(TestWebApplicationFactory factory)
    : IClassFixture<TestWebApplicationFactory>
{
    [Fact]
    public async Task Admin_ReceivesDashboardAggregates()
    {
        await factory.ResetDatabaseAsync();
        var admin = await factory.CreateUserAsync("admin@example.com", UserRole.Admin, UserStatus.Active);
        var activeEmployee = await factory.CreateUserAsync(
            "active@example.com",
            UserRole.Employee,
            UserStatus.Active);
        await factory.CreateUserAsync("pending@example.com", UserRole.Employee, UserStatus.Pending);
        await factory.CreateTaskAsync(admin, activeEmployee);
        using var client = await factory.CreateAuthenticatedClientAsync(admin);

        var response = await client.GetAsync("/api/admin/dashboard");
        var dashboard = await response.Content.ReadFromJsonAsync<AdminDashboardDto>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(3, dashboard!.TotalUsers);
        Assert.Equal(2, dashboard.TotalEmployees);
        Assert.Equal(1, dashboard.ActiveEmployees);
        Assert.Equal(1, dashboard.PendingRegistrations);
        Assert.Equal(1, dashboard.TotalTasks);
        Assert.Equal(1, dashboard.PendingTasks);
    }

    [Fact]
    public async Task Employee_CannotAccessAdminDashboard()
    {
        await factory.ResetDatabaseAsync();
        var employee = await factory.CreateUserAsync(
            "employee@example.com",
            UserRole.Employee,
            UserStatus.Active);
        using var client = await factory.CreateAuthenticatedClientAsync(employee);

        var response = await client.GetAsync("/api/admin/dashboard");
        var statisticsResponse = await client.GetAsync("/api/admin/dashboard/task-statistics");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, statisticsResponse.StatusCode);
    }

    [Fact]
    public async Task Admin_ReceivesTaskStatisticsForEveryEmployeeIncludingEmployeesWithoutTasks()
    {
        await factory.ResetDatabaseAsync();
        var admin = await factory.CreateUserAsync("admin@example.com", UserRole.Admin, UserStatus.Active);
        var employeeA = await factory.CreateUserAsync("a@example.com", UserRole.Employee, UserStatus.Active);
        var employeeB = await factory.CreateUserAsync("b@example.com", UserRole.Employee, UserStatus.Active);
        await factory.CreateTaskAsync(admin, employeeA, "Pending task");
        var inProgressTask = await factory.CreateTaskAsync(admin, employeeA, "In progress task");
        var completedTask = await factory.CreateTaskAsync(admin, employeeA, "Completed task");
        using var client = await factory.CreateAuthenticatedClientAsync(admin);
        await client.PatchAsJsonAsync(
            $"/api/tasks/{inProgressTask.Id}/status",
            new { status = TaskItemStatus.InProgress });
        await client.PatchAsJsonAsync(
            $"/api/tasks/{completedTask.Id}/status",
            new { status = TaskItemStatus.Completed });

        var response = await client.GetAsync("/api/admin/dashboard/task-statistics");
        var statistics = await response.Content.ReadFromJsonAsync<List<EmployeeTaskStatisticsDto>>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(2, statistics!.Count);

        var employeeAStatistics = Assert.Single(statistics, item => item.EmployeeId == employeeA.Id);
        Assert.Equal(3, employeeAStatistics.TotalTasks);
        Assert.Equal(1, employeeAStatistics.PendingTasks);
        Assert.Equal(1, employeeAStatistics.InProgressTasks);
        Assert.Equal(1, employeeAStatistics.CompletedTasks);

        var employeeBStatistics = Assert.Single(statistics, item => item.EmployeeId == employeeB.Id);
        Assert.Equal(0, employeeBStatistics.TotalTasks);
        Assert.Equal(0, employeeBStatistics.PendingTasks);
        Assert.Equal(0, employeeBStatistics.InProgressTasks);
        Assert.Equal(0, employeeBStatistics.CompletedTasks);
    }
}
