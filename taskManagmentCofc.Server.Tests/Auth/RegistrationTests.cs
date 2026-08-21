using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using taskManagmentCofc.Server.Data;
using taskManagmentCofc.Server.Enums;
using taskManagmentCofc.Server.Tests.Infrastructure;

namespace taskManagmentCofc.Server.Tests.Auth;

public sealed class RegistrationTests(TestWebApplicationFactory factory)
    : IClassFixture<TestWebApplicationFactory>
{
    [Fact]
    public async Task SelfRegistration_CreatesPendingEmployee()
    {
        await factory.ResetDatabaseAsync();
        using var client = factory.CreateApiClient();

        var response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            fullName = "New Employee",
            email = "employee@example.com",
            password = TestWebApplicationFactory.DefaultPassword,
            confirmPassword = TestWebApplicationFactory.DefaultPassword
        });

        Assert.Equal(HttpStatusCode.Accepted, response.StatusCode);
        await using var scope = factory.Services.CreateAsyncScope();
        var user = await scope.ServiceProvider.GetRequiredService<AppDbContext>()
            .Users.SingleAsync();
        Assert.Equal(UserRole.Employee, user.Role);
        Assert.Equal(UserStatus.Pending, user.Status);
        Assert.NotEqual(TestWebApplicationFactory.DefaultPassword, user.PasswordHash);
    }

    [Fact]
    public async Task SelfRegistration_NotifiesEveryActiveAdmin()
    {
        await factory.ResetDatabaseAsync();
        var activeAdminA = await factory.CreateUserAsync("admin-a@example.com", UserRole.Admin, UserStatus.Active);
        var activeAdminB = await factory.CreateUserAsync("admin-b@example.com", UserRole.Admin, UserStatus.Active);
        await factory.CreateUserAsync("inactive-admin@example.com", UserRole.Admin, UserStatus.Rejected);
        using var client = factory.CreateApiClient();

        var response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            fullName = "New Employee",
            email = "new.employee@example.com",
            password = TestWebApplicationFactory.DefaultPassword,
            confirmPassword = TestWebApplicationFactory.DefaultPassword
        });

        Assert.Equal(HttpStatusCode.Accepted, response.StatusCode);
        await using var scope = factory.Services.CreateAsyncScope();
        var notifications = await scope.ServiceProvider.GetRequiredService<AppDbContext>()
            .Notifications
            .OrderBy(notification => notification.UserId)
            .ToListAsync();

        Assert.Equal(2, notifications.Count);
        Assert.Contains(notifications, notification => notification.UserId == activeAdminA.Id);
        Assert.Contains(notifications, notification => notification.UserId == activeAdminB.Id);
        Assert.All(notifications, notification =>
        {
            Assert.False(notification.IsRead);
            Assert.Contains("New Employee", notification.Message);
            Assert.Contains("new.employee@example.com", notification.Message);
        });
    }

    [Fact]
    public async Task DuplicateEmail_FailsCaseInsensitively()
    {
        await factory.ResetDatabaseAsync();
        await factory.CreateUserAsync("duplicate@example.com", UserRole.Employee, UserStatus.Pending);
        using var client = factory.CreateApiClient();

        var response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            fullName = "Duplicate",
            email = "DUPLICATE@EXAMPLE.COM",
            password = TestWebApplicationFactory.DefaultPassword,
            confirmPassword = TestWebApplicationFactory.DefaultPassword
        });

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task InvalidEmail_FailsValidation()
    {
        await factory.ResetDatabaseAsync();
        using var client = factory.CreateApiClient();

        var response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            fullName = "Invalid Email",
            email = "not-an-email",
            password = TestWebApplicationFactory.DefaultPassword,
            confirmPassword = TestWebApplicationFactory.DefaultPassword
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task ExtraRoleProperty_CannotSelfRegisterAsAdmin()
    {
        await factory.ResetDatabaseAsync();
        using var client = factory.CreateApiClient();

        var response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            fullName = "Attempted Admin",
            email = "attempt@example.com",
            password = TestWebApplicationFactory.DefaultPassword,
            confirmPassword = TestWebApplicationFactory.DefaultPassword,
            role = UserRole.Admin
        });

        Assert.Equal(HttpStatusCode.Accepted, response.StatusCode);
        await using var scope = factory.Services.CreateAsyncScope();
        var user = await scope.ServiceProvider.GetRequiredService<AppDbContext>()
            .Users.SingleAsync();
        Assert.Equal(UserRole.Employee, user.Role);
        Assert.Equal(UserStatus.Pending, user.Status);
    }
}
