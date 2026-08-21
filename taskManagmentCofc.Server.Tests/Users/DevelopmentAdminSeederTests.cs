using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using taskManagmentCofc.Server.Data;
using taskManagmentCofc.Server.Enums;
using taskManagmentCofc.Server.Security;
using taskManagmentCofc.Server.Services.Implementations;

namespace taskManagmentCofc.Server.Tests.Users;

public sealed class DevelopmentAdminSeederTests
{
    [Fact]
    public async Task MissingPassword_DoesNotCreateDefaultAdmin()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        await using var db = CreateDbContext(connection);
        var seeder = CreateSeeder(db, password: null);

        await seeder.SeedAsync();

        Assert.Empty(await db.Database.GetAppliedMigrationsAsync());
    }

    [Fact]
    public async Task ConfiguredAdminSeed_IsActiveAndIdempotent()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        await using var db = CreateDbContext(connection);
        await db.Database.EnsureCreatedAsync();
        var seeder = CreateSeeder(db, "SeedPassword123");

        await seeder.SeedAsync();
        await seeder.SeedAsync();

        var admin = Assert.Single(await db.Users.AsNoTracking().ToListAsync());
        Assert.Equal(UserRole.Admin, admin.Role);
        Assert.Equal(UserStatus.Active, admin.Status);
        Assert.Equal("ADMIN@EXAMPLE.COM", admin.NormalizedEmail);
        Assert.NotEqual("SeedPassword123", admin.PasswordHash);
    }

    private static AppDbContext CreateDbContext(SqliteConnection connection)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(connection)
            .Options;
        return new AppDbContext(options);
    }

    private static DevelopmentAdminSeeder CreateSeeder(AppDbContext db, string? password)
    {
        return new DevelopmentAdminSeeder(
            db,
            new PasswordHasherService(),
            Options.Create(new SeedAdminOptions
            {
                FullName = "System Admin",
                Email = "admin@example.com",
                Password = password
            }),
            NullLogger<DevelopmentAdminSeeder>.Instance);
    }
}
