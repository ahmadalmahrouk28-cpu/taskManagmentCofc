using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using taskManagmentCofc.Server.Data;
using taskManagmentCofc.Server.DTOs.Notifications;
using taskManagmentCofc.Server.Entities;
using taskManagmentCofc.Server.Enums;
using taskManagmentCofc.Server.Tests.Infrastructure;

namespace taskManagmentCofc.Server.Tests.Users;

public sealed class NotificationTests(TestWebApplicationFactory factory)
    : IClassFixture<TestWebApplicationFactory>
{
    [Fact]
    public async Task User_ReceivesOnlyOwnNotifications()
    {
        await factory.ResetDatabaseAsync();
        var employeeA = await factory.CreateUserAsync("a@example.com", UserRole.Employee, UserStatus.Active);
        var employeeB = await factory.CreateUserAsync("b@example.com", UserRole.Employee, UserStatus.Active);
        var ownNotification = await CreateNotificationAsync(employeeA.Id, "Own notification");
        await CreateNotificationAsync(employeeB.Id, "Other notification");
        using var client = await factory.CreateAuthenticatedClientAsync(employeeA);

        var notifications = await client.GetFromJsonAsync<List<NotificationDto>>("/api/notifications");

        var returnedNotification = Assert.Single(notifications!);
        Assert.Equal(ownNotification.Id, returnedNotification.Id);
        Assert.Equal("Own notification", returnedNotification.Message);
    }

    [Fact]
    public async Task User_CanMarkOwnNotificationAsRead()
    {
        await factory.ResetDatabaseAsync();
        var employee = await factory.CreateUserAsync("employee@example.com", UserRole.Employee, UserStatus.Active);
        var notification = await CreateNotificationAsync(employee.Id, "Unread notification");
        using var client = await factory.CreateAuthenticatedClientAsync(employee);

        var response = await client.PatchAsync($"/api/notifications/{notification.Id}/read", null);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        await using var scope = factory.Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        Assert.True(await dbContext.Notifications
            .Where(item => item.Id == notification.Id)
            .Select(item => item.IsRead)
            .SingleAsync());
    }

    [Fact]
    public async Task User_CannotMarkAnotherUsersNotificationAsRead()
    {
        await factory.ResetDatabaseAsync();
        var employeeA = await factory.CreateUserAsync("a@example.com", UserRole.Employee, UserStatus.Active);
        var employeeB = await factory.CreateUserAsync("b@example.com", UserRole.Employee, UserStatus.Active);
        var otherNotification = await CreateNotificationAsync(employeeB.Id, "Private notification");
        using var client = await factory.CreateAuthenticatedClientAsync(employeeA);

        var response = await client.PatchAsync($"/api/notifications/{otherNotification.Id}/read", null);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        await using var scope = factory.Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        Assert.False(await dbContext.Notifications
            .Where(item => item.Id == otherNotification.Id)
            .Select(item => item.IsRead)
            .SingleAsync());
    }

    private async Task<Notification> CreateNotificationAsync(Guid userId, string message)
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Message = message,
            IsRead = false
        };
        dbContext.Notifications.Add(notification);
        await dbContext.SaveChangesAsync();
        return notification;
    }
}
