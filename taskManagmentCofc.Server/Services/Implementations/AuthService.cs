using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using taskManagmentCofc.Server.Common;
using taskManagmentCofc.Server.Data;
using taskManagmentCofc.Server.DTOs.Auth;
using taskManagmentCofc.Server.Entities;
using taskManagmentCofc.Server.Enums;
using taskManagmentCofc.Server.Services.Interfaces;

namespace taskManagmentCofc.Server.Services.Implementations;

public sealed class AuthService(
    AppDbContext dbContext,
    IPasswordHasherService passwordHasherService,
    IJwtTokenService jwtTokenService) : IAuthService
{
    public async Task<RegistrationResult> RegisterAsync(
        RegisterRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!string.Equals(request.Password, request.ConfirmPassword, StringComparison.Ordinal))
        {
            return RegistrationResult.PasswordMismatch;
        }

        var email = request.Email.Trim();
        var normalizedEmail = email.ToUpperInvariant();

        if (await dbContext.Users.AnyAsync(
                user => user.NormalizedEmail == normalizedEmail,
                cancellationToken))
        {
            return RegistrationResult.DuplicateEmail;
        }

        var user = new User
        {
            FullName = request.FullName.Trim(),
            Email = email,
            NormalizedEmail = normalizedEmail,
            // لا يملك التسجيل الذاتي أي مسار لاختيار دور المسؤول أو تجاوز الموافقة.
            Role = UserRole.Employee,
            Status = UserStatus.Pending
        };

        user.PasswordHash = passwordHasherService.HashPassword(user, request.Password);
        var activeAdminIds = await dbContext.Users
            .AsNoTracking()
            .Where(existingUser =>
                existingUser.Role == UserRole.Admin &&
                existingUser.Status == UserStatus.Active)
            .Select(existingUser => existingUser.Id)
            .ToListAsync(cancellationToken);

        dbContext.Users.Add(user);
        dbContext.Notifications.AddRange(activeAdminIds.Select(adminId => new Notification
        {
            UserId = adminId,
            Message = $"يوجد طلب تسجيل جديد من {user.FullName} ({user.Email}) بانتظار المراجعة.",
            IsRead = false
        }));

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (IsUniqueEmailViolation(exception))
        {
            dbContext.Entry(user).State = EntityState.Detached;
            return RegistrationResult.DuplicateEmail;
        }

        return RegistrationResult.Success;
    }

    public async Task<LoginResult> LoginAsync(
        LoginRequest request,
        CancellationToken cancellationToken = default)
    {
        var normalizedEmail = request.Email.Trim().ToUpperInvariant();
        var user = await dbContext.Users.SingleOrDefaultAsync(
            user => user.NormalizedEmail == normalizedEmail,
            cancellationToken);

        var verificationResult = passwordHasherService.VerifyPassword(
            user,
            user?.PasswordHash,
            request.Password);

        if (user is null || verificationResult == PasswordVerificationResult.Failed)
        {
            return new LoginResult(LoginResultType.InvalidCredentials);
        }

        if (verificationResult == PasswordVerificationResult.SuccessRehashNeeded)
        {
            user.PasswordHash = passwordHasherService.HashPassword(user, request.Password);
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        if (user.Status == UserStatus.Pending)
        {
            return new LoginResult(LoginResultType.AccountPending);
        }

        if (user.Status == UserStatus.Rejected)
        {
            return new LoginResult(
                LoginResultType.AccountRejected,
                RejectionReason: user.RejectionReason);
        }

        var token = jwtTokenService.CreateAccessToken(user);
        var response = new AuthResponse(
            token.AccessToken,
            token.ExpiresAtUtc,
            MapUser(user));

        return new LoginResult(LoginResultType.Success, response);
    }

    public Task<AuthUserDto?> GetCurrentUserAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        return dbContext.Users
            .AsNoTracking()
            .Where(user => user.Id == userId && user.Status == UserStatus.Active)
            .Select(user => new AuthUserDto(
                user.Id,
                user.FullName,
                user.Email,
                user.Role,
                user.Status))
            .SingleOrDefaultAsync(cancellationToken);
    }

    private static AuthUserDto MapUser(User user)
    {
        return new AuthUserDto(
            user.Id,
            user.FullName,
            user.Email,
            user.Role,
            user.Status);
    }

    private static bool IsUniqueEmailViolation(DbUpdateException exception) =>
        SqlServerErrorClassifier.IsUniqueConstraintViolation(exception);
}
