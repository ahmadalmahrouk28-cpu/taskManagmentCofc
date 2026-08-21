using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using taskManagmentCofc.Server.Entities;
using taskManagmentCofc.Server.Enums;
using taskManagmentCofc.Server.Security;
using taskManagmentCofc.Server.Services.Interfaces;

namespace taskManagmentCofc.Server.Data;

public sealed class DevelopmentAdminSeeder(
    AppDbContext dbContext,
    IPasswordHasherService passwordHasherService,
    IOptions<SeedAdminOptions> options,
    ILogger<DevelopmentAdminSeeder> logger)
{
    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        var seedOptions = options.Value;

        if (string.IsNullOrWhiteSpace(seedOptions.Password))
        {
            // لا يُنشأ مسؤول بكلمة مرور افتراضية؛ يجب توفير السر صراحة في بيئة التطوير.
            logger.LogWarning(
                "Development admin was not seeded because SeedAdmin password is not configured.");
            return;
        }

        if (string.IsNullOrWhiteSpace(seedOptions.FullName) ||
            string.IsNullOrWhiteSpace(seedOptions.Email) ||
            !new EmailAddressAttribute().IsValid(seedOptions.Email) ||
            !new PasswordPolicyAttribute().IsValid(seedOptions.Password))
        {
            logger.LogWarning(
                "Development admin was not seeded because SeedAdmin configuration is invalid.");
            return;
        }

        var email = seedOptions.Email.Trim();
        var normalizedEmail = email.ToUpperInvariant();
        var accountExists = await dbContext.Users
            .AsNoTracking()
            .AnyAsync(user => user.NormalizedEmail == normalizedEmail, cancellationToken);

        if (accountExists)
        {
            logger.LogInformation("Development admin seed account already exists.");
            return;
        }

        var admin = new User
        {
            Id = Guid.NewGuid(),
            FullName = seedOptions.FullName.Trim(),
            Email = email,
            NormalizedEmail = normalizedEmail,
            Role = UserRole.Admin,
            Status = UserStatus.Active
        };
        admin.PasswordHash = passwordHasherService.HashPassword(admin, seedOptions.Password);

        dbContext.Users.Add(admin);
        await dbContext.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Development admin seed account was created.");
    }
}
