using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using taskManagmentCofc.Server.Data;
using taskManagmentCofc.Server.DTOs.Users;
using taskManagmentCofc.Server.Enums;
using taskManagmentCofc.Server.Services;
using taskManagmentCofc.Server.Services.Interfaces;
using taskManagmentCofc.Server.Tests.Infrastructure;

namespace taskManagmentCofc.Server.Tests.Users;

public sealed class AdminUsersTests(TestWebApplicationFactory factory)
    : IClassFixture<TestWebApplicationFactory>
{
    [Theory]
    [InlineData(UserRole.Employee)]
    [InlineData(UserRole.Admin)]
    public async Task Admin_CreatesActiveUser(UserRole role)
    {
        await factory.ResetDatabaseAsync();
        var admin = await factory.CreateUserAsync("admin@example.com", UserRole.Admin, UserStatus.Active);
        using var client = await factory.CreateAuthenticatedClientAsync(admin);

        var response = await client.PostAsJsonAsync("/api/admin/users", CreateRequest(
            role == UserRole.Admin ? "new-admin@example.com" : "new-employee@example.com",
            role));
        var created = await response.Content.ReadFromJsonAsync<AdminUserDto>();

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.Equal(role, created!.Role);
        Assert.Equal(UserStatus.Active, created.Status);
    }

    [Fact]
    public async Task Employee_CannotCreateUser()
    {
        await factory.ResetDatabaseAsync();
        var employee = await factory.CreateUserAsync("employee@example.com", UserRole.Employee, UserStatus.Active);
        using var client = await factory.CreateAuthenticatedClientAsync(employee);

        var response = await client.PostAsJsonAsync(
            "/api/admin/users",
            CreateRequest("new@example.com", UserRole.Employee));

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task DuplicateEmail_FailsCaseInsensitively()
    {
        await factory.ResetDatabaseAsync();
        var admin = await factory.CreateUserAsync("admin@example.com", UserRole.Admin, UserStatus.Active);
        await factory.CreateUserAsync("duplicate@example.com", UserRole.Employee, UserStatus.Active);
        using var client = await factory.CreateAuthenticatedClientAsync(admin);

        var response = await client.PostAsJsonAsync(
            "/api/admin/users",
            CreateRequest("DUPLICATE@EXAMPLE.COM", UserRole.Employee));

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Admin_UpdatesAndDeletesEmployee()
    {
        await factory.ResetDatabaseAsync();
        var admin = await factory.CreateUserAsync("admin@example.com", UserRole.Admin, UserStatus.Active);
        var employee = await factory.CreateUserAsync(
            "employee@example.com",
            UserRole.Employee,
            UserStatus.Active);
        using var client = await factory.CreateAuthenticatedClientAsync(admin);

        var updateResponse = await client.PutAsJsonAsync($"/api/admin/users/{employee.Id}", new
        {
            fullName = "Updated Employee",
            email = "updated@example.com",
            role = UserRole.Employee
        });
        var updated = await updateResponse.Content.ReadFromJsonAsync<AdminUserDto>();
        var deleteResponse = await client.DeleteAsync($"/api/admin/users/{employee.Id}");

        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);
        Assert.Equal("Updated Employee", updated!.FullName);
        Assert.Equal("updated@example.com", updated.Email);
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        await using var scope = factory.Services.CreateAsyncScope();
        Assert.False(await scope.ServiceProvider.GetRequiredService<AppDbContext>()
            .Users.AnyAsync(user => user.Id == employee.Id));
    }

    [Fact]
    public async Task LastAdmin_CannotBeDeleted()
    {
        await factory.ResetDatabaseAsync();
        var admin = await factory.CreateUserAsync("admin@example.com", UserRole.Admin, UserStatus.Active);
        await using var scope = factory.Services.CreateAsyncScope();
        var result = await scope.ServiceProvider.GetRequiredService<IAdminUserService>()
            .DeleteAsync(admin.Id, Guid.NewGuid());

        Assert.Equal(AdminUserManagementResultType.LastActiveAdmin, result.Type);
        Assert.True(await scope.ServiceProvider.GetRequiredService<AppDbContext>()
            .Users.AnyAsync(user => user.Id == admin.Id));
    }

    [Fact]
    public async Task CurrentAdmin_CannotDeleteOwnAccount()
    {
        await factory.ResetDatabaseAsync();
        var admin = await factory.CreateUserAsync("admin@example.com", UserRole.Admin, UserStatus.Active);
        using var client = await factory.CreateAuthenticatedClientAsync(admin);

        var response = await client.DeleteAsync($"/api/admin/users/{admin.Id}");

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    private static object CreateRequest(string email, UserRole role) => new
    {
        fullName = "Created User",
        email,
        password = TestWebApplicationFactory.DefaultPassword,
        confirmPassword = TestWebApplicationFactory.DefaultPassword,
        role
    };
}
