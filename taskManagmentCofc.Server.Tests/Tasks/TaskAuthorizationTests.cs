using System.Net;
using System.Net.Http.Json;
using taskManagmentCofc.Server.DTOs.Tasks;
using taskManagmentCofc.Server.Enums;
using taskManagmentCofc.Server.Tests.Infrastructure;

namespace taskManagmentCofc.Server.Tests.Tasks;

public sealed class TaskAuthorizationTests(TestWebApplicationFactory factory)
    : IClassFixture<TestWebApplicationFactory>
{
    [Fact]
    public async Task Admin_CreatesTaskAssignedToActiveEmployee()
    {
        await factory.ResetDatabaseAsync();
        var admin = await factory.CreateUserAsync("admin@example.com", UserRole.Admin, UserStatus.Active);
        var employee = await factory.CreateUserAsync("employee@example.com", UserRole.Employee, UserStatus.Active);
        using var client = await factory.CreateAuthenticatedClientAsync(admin);

        var response = await client.PostAsJsonAsync("/api/tasks", new
        {
            title = "Created task",
            description = "Task description",
            assignedToUserId = employee.Id
        });
        var task = await response.Content.ReadFromJsonAsync<TaskDetailsDto>();

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.Equal(TaskItemStatus.Pending, task!.Status);
        Assert.Equal(employee.Id, task.AssignedTo!.Id);
        Assert.Equal(admin.Id, task.CreatedBy.Id);
    }

    [Fact]
    public async Task Employee_CannotCreateTask()
    {
        await factory.ResetDatabaseAsync();
        var employee = await factory.CreateUserAsync("employee@example.com", UserRole.Employee, UserStatus.Active);
        using var client = await factory.CreateAuthenticatedClientAsync(employee);

        var response = await client.PostAsJsonAsync("/api/tasks", new
        {
            title = "Forbidden task",
            description = "Task description",
            assignedToUserId = employee.Id
        });

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Admin_SeesAllTasks()
    {
        await factory.ResetDatabaseAsync();
        var admin = await factory.CreateUserAsync("admin@example.com", UserRole.Admin, UserStatus.Active);
        var employeeA = await factory.CreateUserAsync("a@example.com", UserRole.Employee, UserStatus.Active);
        var employeeB = await factory.CreateUserAsync("b@example.com", UserRole.Employee, UserStatus.Active);
        await factory.CreateTaskAsync(admin, employeeA, "Task A");
        await factory.CreateTaskAsync(admin, employeeB, "Task B");
        using var client = await factory.CreateAuthenticatedClientAsync(admin);

        var tasks = await client.GetFromJsonAsync<List<TaskListItemDto>>("/api/tasks");

        Assert.Equal(2, tasks!.Count);
    }

    [Fact]
    public async Task Employee_ListContainsOnlyAssignedTasks()
    {
        await factory.ResetDatabaseAsync();
        var admin = await factory.CreateUserAsync("admin@example.com", UserRole.Admin, UserStatus.Active);
        var employeeA = await factory.CreateUserAsync("a@example.com", UserRole.Employee, UserStatus.Active);
        var employeeB = await factory.CreateUserAsync("b@example.com", UserRole.Employee, UserStatus.Active);
        var ownTask = await factory.CreateTaskAsync(admin, employeeA, "Own task");
        await factory.CreateTaskAsync(admin, employeeB, "Other task");
        using var client = await factory.CreateAuthenticatedClientAsync(employeeA);

        var tasks = await client.GetFromJsonAsync<List<TaskListItemDto>>("/api/tasks");

        var returnedTask = Assert.Single(tasks!);
        Assert.Equal(ownTask.Id, returnedTask.Id);
    }

    [Fact]
    public async Task Employee_CannotReadOrUpdateAnotherEmployeesTask_IdorIsHiddenAsNotFound()
    {
        await factory.ResetDatabaseAsync();
        var admin = await factory.CreateUserAsync("admin@example.com", UserRole.Admin, UserStatus.Active);
        var employeeA = await factory.CreateUserAsync("a@example.com", UserRole.Employee, UserStatus.Active);
        var employeeB = await factory.CreateUserAsync("b@example.com", UserRole.Employee, UserStatus.Active);
        var taskForB = await factory.CreateTaskAsync(admin, employeeB, "Private task B");
        using var client = await factory.CreateAuthenticatedClientAsync(employeeA);

        var getResponse = await client.GetAsync($"/api/tasks/{taskForB.Id}");
        var patchResponse = await client.PatchAsJsonAsync(
            $"/api/tasks/{taskForB.Id}/status",
            new { status = TaskItemStatus.Completed });

        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, patchResponse.StatusCode);
    }

    [Fact]
    public async Task Employee_CanUpdateOwnTaskStatus()
    {
        await factory.ResetDatabaseAsync();
        var admin = await factory.CreateUserAsync("admin@example.com", UserRole.Admin, UserStatus.Active);
        var employee = await factory.CreateUserAsync("employee@example.com", UserRole.Employee, UserStatus.Active);
        var task = await factory.CreateTaskAsync(admin, employee);
        using var client = await factory.CreateAuthenticatedClientAsync(employee);

        var response = await client.PatchAsJsonAsync(
            $"/api/tasks/{task.Id}/status",
            new { status = TaskItemStatus.InProgress });
        var updated = await response.Content.ReadFromJsonAsync<TaskDetailsDto>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(TaskItemStatus.InProgress, updated!.Status);
    }

    [Fact]
    public async Task EmployeeStatusUpdate_IsImmediatelyVisibleInAdminTaskList()
    {
        await factory.ResetDatabaseAsync();
        var admin = await factory.CreateUserAsync("admin@example.com", UserRole.Admin, UserStatus.Active);
        var employee = await factory.CreateUserAsync("employee@example.com", UserRole.Employee, UserStatus.Active);
        var task = await factory.CreateTaskAsync(admin, employee);
        using var employeeClient = await factory.CreateAuthenticatedClientAsync(employee);
        using var adminClient = await factory.CreateAuthenticatedClientAsync(admin);

        var updateResponse = await employeeClient.PatchAsJsonAsync(
            $"/api/tasks/{task.Id}/status",
            new { status = TaskItemStatus.Completed });
        var adminResponse = await adminClient.GetAsync("/api/tasks");
        var adminTasks = await adminResponse.Content.ReadFromJsonAsync<List<TaskListItemDto>>();

        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);
        Assert.Contains("no-store", adminResponse.Headers.CacheControl?.ToString() ?? string.Empty);
        var adminTask = Assert.Single(adminTasks!);
        Assert.Equal(task.Id, adminTask.Id);
        Assert.Equal(TaskItemStatus.Completed, adminTask.Status);
    }

    [Fact]
    public async Task Employee_CannotEditTaskContentOrDeleteTask()
    {
        await factory.ResetDatabaseAsync();
        var admin = await factory.CreateUserAsync("admin@example.com", UserRole.Admin, UserStatus.Active);
        var employee = await factory.CreateUserAsync("employee@example.com", UserRole.Employee, UserStatus.Active);
        var task = await factory.CreateTaskAsync(admin, employee);
        using var client = await factory.CreateAuthenticatedClientAsync(employee);

        var updateResponse = await client.PutAsJsonAsync($"/api/tasks/{task.Id}", new
        {
            title = "Unauthorized edit",
            description = "Unauthorized description",
            assignedToUserId = employee.Id,
            status = TaskItemStatus.Completed
        });
        var deleteResponse = await client.DeleteAsync($"/api/tasks/{task.Id}");

        Assert.Equal(HttpStatusCode.Forbidden, updateResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, deleteResponse.StatusCode);
    }

    [Fact]
    public async Task Admin_CanEditTaskAndChangeStatus()
    {
        await factory.ResetDatabaseAsync();
        var admin = await factory.CreateUserAsync("admin@example.com", UserRole.Admin, UserStatus.Active);
        var employee = await factory.CreateUserAsync("employee@example.com", UserRole.Employee, UserStatus.Active);
        var task = await factory.CreateTaskAsync(admin, employee);
        using var client = await factory.CreateAuthenticatedClientAsync(admin);

        var updateResponse = await client.PutAsJsonAsync($"/api/tasks/{task.Id}", new
        {
            title = "Updated title",
            description = "Updated description",
            assignedToUserId = employee.Id,
            status = TaskItemStatus.InProgress
        });
        var statusResponse = await client.PatchAsJsonAsync(
            $"/api/tasks/{task.Id}/status",
            new { status = TaskItemStatus.Completed });
        var statusTask = await statusResponse.Content.ReadFromJsonAsync<TaskDetailsDto>();

        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);
        Assert.Equal(HttpStatusCode.OK, statusResponse.StatusCode);
        Assert.Equal(TaskItemStatus.Completed, statusTask!.Status);
    }

    [Fact]
    public async Task Admin_CanDeleteTask()
    {
        await factory.ResetDatabaseAsync();
        var admin = await factory.CreateUserAsync("admin@example.com", UserRole.Admin, UserStatus.Active);
        var employee = await factory.CreateUserAsync("employee@example.com", UserRole.Employee, UserStatus.Active);
        var task = await factory.CreateTaskAsync(admin, employee);
        using var client = await factory.CreateAuthenticatedClientAsync(admin);

        var response = await client.DeleteAsync($"/api/tasks/{task.Id}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }
}
