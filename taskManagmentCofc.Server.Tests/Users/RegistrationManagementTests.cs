using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using taskManagmentCofc.Server.Data;
using taskManagmentCofc.Server.DTOs.Users;
using taskManagmentCofc.Server.Enums;
using taskManagmentCofc.Server.Services.Interfaces;
using taskManagmentCofc.Server.Tests.Infrastructure;

namespace taskManagmentCofc.Server.Tests.Users;

public sealed class RegistrationManagementTests(TestWebApplicationFactory factory)
    : IClassFixture<TestWebApplicationFactory>
{
    [Fact]
    public async Task Admin_SeesOnlyPendingRegistrations()
    {
        await factory.ResetDatabaseAsync();
        var admin = await factory.CreateUserAsync("admin@example.com", UserRole.Admin, UserStatus.Active);
        var pending = await factory.CreateUserAsync("pending@example.com", UserRole.Employee, UserStatus.Pending);
        await factory.CreateUserAsync("active@example.com", UserRole.Employee, UserStatus.Active);
        using var client = await factory.CreateAuthenticatedClientAsync(admin);

        var registrations = await client.GetFromJsonAsync<List<PendingRegistrationDto>>(
            "/api/admin/registrations/pending");

        var registration = Assert.Single(registrations!);
        Assert.Equal(pending.Id, registration.Id);
        Assert.Equal(UserStatus.Pending, registration.Status);
    }

    [Fact]
    public async Task Admin_ApprovesPendingRegistration_AndMakesItActive()
    {
        await factory.ResetDatabaseAsync();
        var admin = await factory.CreateUserAsync("admin@example.com", UserRole.Admin, UserStatus.Active);
        var pending = await factory.CreateUserAsync("pending@example.com", UserRole.Employee, UserStatus.Pending);
        using var client = await factory.CreateAuthenticatedClientAsync(admin);

        var response = await client.PostAsync(
            $"/api/admin/registrations/{pending.Id}/approve",
            content: null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var updated = await db.Users.SingleAsync(user => user.Id == pending.Id);
        var notification = await db.Notifications.SingleAsync(item => item.UserId == pending.Id);
        var emailService = Assert.IsType<TestEmailService>(
            scope.ServiceProvider.GetRequiredService<IEmailService>());
        Assert.Equal(UserStatus.Active, updated.Status);
        Assert.Null(updated.RejectionReason);
        Assert.Equal("تمت الموافقة على طلب تسجيلك، ويمكنك الآن تسجيل الدخول.", notification.Message);
        var approvalEmail = Assert.Single(emailService.SentEmails);
        Assert.Equal(pending.Email, approvalEmail.RecipientEmail);
        Assert.Contains("الموافقة", approvalEmail.Subject);
    }

    [Fact]
    public async Task Admin_RejectsPendingRegistration_AndStoresReason()
    {
        await factory.ResetDatabaseAsync();
        var admin = await factory.CreateUserAsync("admin@example.com", UserRole.Admin, UserStatus.Active);
        var pending = await factory.CreateUserAsync("pending@example.com", UserRole.Employee, UserStatus.Pending);
        using var client = await factory.CreateAuthenticatedClientAsync(admin);

        var response = await client.PostAsJsonAsync(
            $"/api/admin/registrations/{pending.Id}/reject",
            new { reason = "Incomplete employment information" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var updated = await db.Users.SingleAsync(user => user.Id == pending.Id);
        var notification = await db.Notifications.SingleAsync(item => item.UserId == pending.Id);
        var emailService = Assert.IsType<TestEmailService>(
            scope.ServiceProvider.GetRequiredService<IEmailService>());
        Assert.Equal(UserStatus.Rejected, updated.Status);
        Assert.Equal("Incomplete employment information", updated.RejectionReason);
        Assert.Contains("Incomplete employment information", notification.Message);
        var rejectionEmail = Assert.Single(emailService.SentEmails);
        Assert.Equal(pending.Email, rejectionEmail.RecipientEmail);
        Assert.Contains("تم رفض", rejectionEmail.Body);
        Assert.Contains("Incomplete employment information", rejectionEmail.Body);
    }

    [Fact]
    public async Task Employee_CannotApproveOrRejectRegistration()
    {
        await factory.ResetDatabaseAsync();
        var employee = await factory.CreateUserAsync("employee@example.com", UserRole.Employee, UserStatus.Active);
        var pending = await factory.CreateUserAsync("pending@example.com", UserRole.Employee, UserStatus.Pending);
        using var client = await factory.CreateAuthenticatedClientAsync(employee);

        var approveResponse = await client.PostAsync(
            $"/api/admin/registrations/{pending.Id}/approve",
            content: null);
        var rejectResponse = await client.PostAsJsonAsync(
            $"/api/admin/registrations/{pending.Id}/reject",
            new { reason = "Not authorized" });

        Assert.Equal(HttpStatusCode.Forbidden, approveResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, rejectResponse.StatusCode);
    }

    [Fact]
    public async Task RejectWithoutReason_FailsValidation()
    {
        await factory.ResetDatabaseAsync();
        var admin = await factory.CreateUserAsync("admin@example.com", UserRole.Admin, UserStatus.Active);
        var pending = await factory.CreateUserAsync("pending@example.com", UserRole.Employee, UserStatus.Pending);
        using var client = await factory.CreateAuthenticatedClientAsync(admin);

        var response = await client.PostAsJsonAsync(
            $"/api/admin/registrations/{pending.Id}/reject",
            new { reason = "   " });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
