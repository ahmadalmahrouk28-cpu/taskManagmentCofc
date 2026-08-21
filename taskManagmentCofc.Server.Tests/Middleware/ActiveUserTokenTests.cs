using System.Net;
using System.Net.Http.Headers;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using taskManagmentCofc.Server.Data;
using taskManagmentCofc.Server.Enums;
using taskManagmentCofc.Server.Tests.Infrastructure;

namespace taskManagmentCofc.Server.Tests.Middleware;

public sealed class ActiveUserTokenTests(TestWebApplicationFactory factory)
    : IClassFixture<TestWebApplicationFactory>
{
    [Fact]
    public async Task ExistingToken_IsRejectedAfterUserStatusChangesToRejected()
    {
        await factory.ResetDatabaseAsync();
        var user = await factory.CreateUserAsync(
            "employee@example.com",
            UserRole.Employee,
            UserStatus.Active);
        using var client = factory.CreateApiClient();
        var token = await factory.LoginAsync(client, user.Email);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var storedUser = await db.Users.SingleAsync(item => item.Id == user.Id);
            storedUser.Status = UserStatus.Rejected;
            storedUser.RejectionReason = "Account disabled after token issuance";
            await db.SaveChangesAsync();
        }

        var response = await client.GetAsync("/api/auth/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
