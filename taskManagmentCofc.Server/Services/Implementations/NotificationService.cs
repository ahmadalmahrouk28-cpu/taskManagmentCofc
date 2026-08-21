using Microsoft.EntityFrameworkCore;
using taskManagmentCofc.Server.Data;
using taskManagmentCofc.Server.DTOs.Notifications;
using taskManagmentCofc.Server.Services.Interfaces;

namespace taskManagmentCofc.Server.Services.Implementations;

public sealed class NotificationService(AppDbContext dbContext) : INotificationService
{
    public async Task<IReadOnlyList<NotificationDto>> GetForUserAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        return await dbContext.Notifications
            .AsNoTracking()
            .Where(notification => notification.UserId == userId)
            .OrderByDescending(notification => notification.CreatedAtUtc)
            .Select(notification => new NotificationDto(
                notification.Id,
                notification.Message,
                notification.IsRead,
                notification.CreatedAtUtc))
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> MarkAsReadAsync(
        Guid notificationId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        // تضمين المالك في التحديث يمنع تعديل إشعار مستخدم آخر عبر تغيير المعرّف يدويًا.
        var updatedRows = await dbContext.Notifications
            .Where(notification =>
                notification.Id == notificationId &&
                notification.UserId == userId)
            .ExecuteUpdateAsync(
                setters => setters.SetProperty(notification => notification.IsRead, true),
                cancellationToken);

        return updatedRows > 0;
    }
}
