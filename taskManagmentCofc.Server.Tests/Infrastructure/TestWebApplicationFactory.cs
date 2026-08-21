using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using taskManagmentCofc.Server.Data;
using taskManagmentCofc.Server.DTOs.Auth;
using taskManagmentCofc.Server.Entities;
using taskManagmentCofc.Server.Enums;
using taskManagmentCofc.Server.Services.Interfaces;

namespace taskManagmentCofc.Server.Tests.Infrastructure;

public sealed class TestWebApplicationFactory : WebApplicationFactory<Program>
{
    public const string DefaultPassword = "Password123";
    private readonly SqliteConnection _databaseConnection = new("Data Source=:memory:");

    public TestWebApplicationFactory()
    {
        _databaseConnection.Open();
        Environment.SetEnvironmentVariable(
            "ConnectionStrings__DefaultConnection",
            "Server=test;Database=test;");
        Environment.SetEnvironmentVariable(
            "Jwt__Key",
            "integration-test-signing-key-with-at-least-32-bytes");
        Environment.SetEnvironmentVariable("Jwt__Issuer", "taskManagmentCofc.Server.Tests");
        Environment.SetEnvironmentVariable("Jwt__Audience", "taskmanagmentcofc.client.tests");
        Environment.SetEnvironmentVariable("Jwt__ExpiresMinutes", "60");
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureLogging(logging => logging.ClearProviders());
        builder.ConfigureAppConfiguration((_, configuration) =>
        {
            configuration.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "Server=test;Database=test;",
                ["Jwt:Key"] = "integration-test-signing-key-with-at-least-32-bytes",
                ["Jwt:Issuer"] = "taskManagmentCofc.Server.Tests",
                ["Jwt:Audience"] = "taskmanagmentcofc.client.tests",
                ["Jwt:ExpiresMinutes"] = "60"
            });
        });

        builder.ConfigureServices(services =>
        {
            var databaseRegistrations = services
                .Where(descriptor =>
                    descriptor.ServiceType == typeof(AppDbContext) ||
                    descriptor.ServiceType == typeof(DbContextOptions<AppDbContext>) ||
                    descriptor.ServiceType.FullName?.Contains("IDbContextOptionsConfiguration") == true)
                .ToList();

            foreach (var registration in databaseRegistrations)
            {
                services.Remove(registration);
            }

            services.AddDbContext<AppDbContext>(options =>
                options.UseSqlite(_databaseConnection));

            services.RemoveAll<IEmailService>();
            services.AddSingleton<IEmailService, TestEmailService>();
        });
    }

    public HttpClient CreateApiClient()
    {
        return CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost"),
            AllowAutoRedirect = false
        });
    }

    public async Task ResetDatabaseAsync()
    {
        if (Services.GetRequiredService<IEmailService>() is TestEmailService emailService)
        {
            emailService.Clear();
        }

        await using var scope = Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await dbContext.Database.EnsureDeletedAsync();
        await dbContext.Database.EnsureCreatedAsync();
    }

    public async Task<User> CreateUserAsync(
        string email,
        UserRole role,
        UserStatus status,
        string password = DefaultPassword,
        string? rejectionReason = null)
    {
        await using var scope = Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasherService>();
        var user = new User
        {
            Id = Guid.NewGuid(),
            FullName = email.Split('@')[0],
            Email = email,
            Role = role,
            Status = status,
            RejectionReason = rejectionReason
        };
        user.PasswordHash = passwordHasher.HashPassword(user, password);
        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync();
        return user;
    }

    public async Task<TaskItem> CreateTaskAsync(User creator, User assignee, string title = "Test task")
    {
        await using var scope = Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var task = new TaskItem
        {
            Id = Guid.NewGuid(),
            Title = title,
            Description = "Integration test task description",
            Status = TaskItemStatus.Pending,
            CreatedByUserId = creator.Id,
            AssignedToUserId = assignee.Id
        };
        dbContext.TaskItems.Add(task);
        await dbContext.SaveChangesAsync();
        return task;
    }

    public async Task<string> LoginAsync(HttpClient client, string email, string password = DefaultPassword)
    {
        var response = await client.PostAsJsonAsync("/api/auth/login", new { email, password });
        response.EnsureSuccessStatusCode();
        var authResponse = await response.Content.ReadFromJsonAsync<AuthResponse>();
        return authResponse!.AccessToken;
    }

    public async Task<HttpClient> CreateAuthenticatedClientAsync(User user)
    {
        var client = CreateApiClient();
        var token = await LoginAsync(client, user.Email);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);

        if (disposing)
        {
            _databaseConnection.Dispose();
        }
    }
}
