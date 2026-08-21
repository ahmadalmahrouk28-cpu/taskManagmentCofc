using System.Net;
using taskManagmentCofc.Server.Tests.Infrastructure;

namespace taskManagmentCofc.Server.Tests.Auth;

public sealed class AnonymousAuthorizationTests(TestWebApplicationFactory factory)
    : IClassFixture<TestWebApplicationFactory>
{
    [Fact]
    public async Task AnonymousUser_CannotAccessProtectedEndpoints()
    {
        await factory.ResetDatabaseAsync();
        using var client = factory.CreateApiClient();

        var meResponse = await client.GetAsync("/api/auth/me");
        var tasksResponse = await client.GetAsync("/api/tasks");
        var dashboardResponse = await client.GetAsync("/api/admin/dashboard");

        Assert.Equal(HttpStatusCode.Unauthorized, meResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, tasksResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, dashboardResponse.StatusCode);
    }
}
