using Microsoft.EntityFrameworkCore;
using taskManagmentCofc.Server.Data;
using taskManagmentCofc.Server.DTOs.Users;
using taskManagmentCofc.Server.Entities;
using taskManagmentCofc.Server.Enums;
using taskManagmentCofc.Server.Services.Interfaces;

namespace taskManagmentCofc.Server.Services.Implementations;

public sealed class RegistrationManagementService(
    AppDbContext dbContext,
    IEmailService emailService) : IRegistrationManagementService
{
    public async Task<IReadOnlyList<PendingRegistrationDto>> GetPendingAsync(
        CancellationToken cancellationToken = default)
    {
        return await dbContext.Users
            .AsNoTracking()
            .Where(user =>
                user.Role == UserRole.Employee &&
                user.Status == UserStatus.Pending)
            .OrderBy(user => user.CreatedAtUtc)
            .Select(user => new PendingRegistrationDto(
                user.Id,
                user.FullName,
                user.Email,
                user.Status,
                user.CreatedAtUtc))
            .ToListAsync(cancellationToken);
    }

    public async Task<RegistrationManagementResult> ApproveAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var user = await dbContext.Users.SingleOrDefaultAsync(
            user => user.Id == userId,
            cancellationToken);
        var validationResult = ValidatePendingEmployee(user);

        if (validationResult != RegistrationManagementResult.Success)
        {
            return validationResult;
        }

        user!.Status = UserStatus.Active;
        user.RejectionReason = null;
        dbContext.Notifications.Add(CreateNotification(
            user.Id,
            "تمت الموافقة على طلب تسجيلك، ويمكنك الآن تسجيل الدخول."));

        await dbContext.SaveChangesAsync(cancellationToken);
        await emailService.SendAsync(
            user.Email,
            "تمت الموافقة على طلب التسجيل",
            $"مرحبًا {user.FullName}،\n\nتمت الموافقة على طلب تسجيلك، ويمكنك الآن تسجيل الدخول.",
            cancellationToken);

        return RegistrationManagementResult.Success;
    }

    public async Task<RegistrationManagementResult> RejectAsync(
        Guid userId,
        string reason,
        CancellationToken cancellationToken = default)
    {
        var user = await dbContext.Users.SingleOrDefaultAsync(
            user => user.Id == userId,
            cancellationToken);
        var validationResult = ValidatePendingEmployee(user);

        if (validationResult != RegistrationManagementResult.Success)
        {
            return validationResult;
        }

        var rejectionReason = reason.Trim();
        user!.Status = UserStatus.Rejected;
        user.RejectionReason = rejectionReason;
        dbContext.Notifications.Add(CreateNotification(
            user.Id,
            $"تم رفض طلب تسجيلك. السبب: {rejectionReason}"));

        await dbContext.SaveChangesAsync(cancellationToken);
        await emailService.SendAsync(
            user.Email,
            "تم رفض طلب التسجيل",
            $"مرحبًا {user.FullName}،\n\nتم رفض طلب تسجيلك.\nالسبب: {rejectionReason}",
            cancellationToken);

        return RegistrationManagementResult.Success;
    }

    private static RegistrationManagementResult ValidatePendingEmployee(User? user)
    {
        if (user is null)
        {
            return RegistrationManagementResult.UserNotFound;
        }

        if (user.Role != UserRole.Employee)
        {
            return RegistrationManagementResult.UserNotEmployee;
        }

        return user.Status == UserStatus.Pending
            ? RegistrationManagementResult.Success
            : RegistrationManagementResult.UserNotPending;
    }

    private static Notification CreateNotification(Guid userId, string message)
    {
        return new Notification
        {
            UserId = userId,
            Message = message,
            IsRead = false
        };
    }
}
