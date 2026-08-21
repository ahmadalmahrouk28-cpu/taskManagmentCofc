using System.Net;
using System.Net.Http.Json;
using taskManagmentCofc.Server.DTOs.Auth;
using taskManagmentCofc.Server.Enums;
using taskManagmentCofc.Server.Tests.Infrastructure;

namespace taskManagmentCofc.Server.Tests.Auth;

public sealed class LoginTests(TestWebApplicationFactory factory)
    : IClassFixture<TestWebApplicationFactory>
{
    [Fact]
    public async Task ActiveUser_ReceivesJwt()
    {
        await factory.ResetDatabaseAsync();
        await factory.CreateUserAsync("active@example.com", UserRole.Employee, UserStatus.Active);
        using var client = factory.CreateApiClient();

        var response = await LoginAsync(client, "active@example.com");
        var body = await response.Content.ReadFromJsonAsync<AuthResponse>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.False(string.IsNullOrWhiteSpace(body?.AccessToken));
        Assert.Equal(UserStatus.Active, body!.User.Status);
    }

    [Theory]
    [InlineData(UserStatus.Pending)]
    [InlineData(UserStatus.Rejected)]
    public async Task InactiveUser_IsForbidden(UserStatus status)
    {
        await factory.ResetDatabaseAsync();
        await factory.CreateUserAsync("inactive@example.com", UserRole.Employee, status);
        using var client = factory.CreateApiClient();

        var response = await LoginAsync(client, "inactive@example.com");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task WrongPassword_IsUnauthorized()
    {
        await factory.ResetDatabaseAsync();
        await factory.CreateUserAsync("known@example.com", UserRole.Employee, UserStatus.Active);
        using var client = factory.CreateApiClient();

        var response = await LoginAsync(client, "known@example.com", "WrongPassword1");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task UnknownEmail_IsUnauthorized()
    {
        await factory.ResetDatabaseAsync();
        using var client = factory.CreateApiClient();

        var response = await LoginAsync(client, "unknown@example.com");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    private static Task<HttpResponseMessage> LoginAsync(
        HttpClient client,
        string email,
        string password = TestWebApplicationFactory.DefaultPassword)
    {
        return client.PostAsJsonAsync("/api/auth/login", new { email, password });
    }
}
