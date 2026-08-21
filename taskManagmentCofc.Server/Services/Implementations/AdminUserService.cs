using System.Data;
using Microsoft.EntityFrameworkCore;
using taskManagmentCofc.Server.Common;
using taskManagmentCofc.Server.Data;
using taskManagmentCofc.Server.DTOs.Users;
using taskManagmentCofc.Server.Entities;
using taskManagmentCofc.Server.Enums;
using taskManagmentCofc.Server.Services.Interfaces;

namespace taskManagmentCofc.Server.Services.Implementations;

public sealed class AdminUserService(
    AppDbContext dbContext,
    IPasswordHasherService passwordHasherService) : IAdminUserService
{
    public async Task<IReadOnlyList<AdminUserDto>> GetAllAsync(
        string? search,
        UserRole? role,
        UserStatus? status,
        CancellationToken cancellationToken = default)
    {
        var query = dbContext.Users.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchTerm = search.Trim();
            query = query.Where(user =>
                user.FullName.Contains(searchTerm) ||
                user.Email.Contains(searchTerm));
        }

        if (role.HasValue)
        {
            query = query.Where(user => user.Role == role.Value);
        }

        if (status.HasValue)
        {
            query = query.Where(user => user.Status == status.Value);
        }

        return await query
            .OrderBy(user => user.FullName)
            .ThenBy(user => user.Email)
            .Select(MapProjection())
            .ToListAsync(cancellationToken);
    }

    public Task<AdminUserDto?> GetByIdAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        return dbContext.Users
            .AsNoTracking()
            .Where(user => user.Id == userId)
            .Select(MapProjection())
            .SingleOrDefaultAsync(cancellationToken);
    }

    public async Task<AdminUserManagementResult> CreateAsync(
        CreateUserRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!string.Equals(request.Password, request.ConfirmPassword, StringComparison.Ordinal))
        {
            return new(AdminUserManagementResultType.PasswordMismatch);
        }

        if (!request.Role.HasValue || !Enum.IsDefined(request.Role.Value))
        {
            return new(AdminUserManagementResultType.InvalidRole);
        }

        var email = request.Email.Trim();
        var normalizedEmail = email.ToUpperInvariant();

        if (await dbContext.Users.AsNoTracking().AnyAsync(
                user => user.NormalizedEmail == normalizedEmail,
                cancellationToken))
        {
            return new(AdminUserManagementResultType.DuplicateEmail);
        }

        var user = new User
        {
            FullName = request.FullName.Trim(),
            Email = email,
            NormalizedEmail = normalizedEmail,
            Role = request.Role.Value,
            Status = UserStatus.Active,
            RejectionReason = null
        };
        user.PasswordHash = passwordHasherService.HashPassword(user, request.Password);
        dbContext.Users.Add(user);

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception)
            when (SqlServerErrorClassifier.IsUniqueConstraintViolation(exception))
        {
            dbContext.Entry(user).State = EntityState.Detached;
            return new(AdminUserManagementResultType.DuplicateEmail);
        }

        return new(AdminUserManagementResultType.Success, Map(user));
    }

    public Task<AdminUserManagementResult> UpdateAsync(
        Guid userId,
        UpdateUserRequest request,
        CancellationToken cancellationToken = default)
    {
        return ExecuteSerializableAsync(
            () => UpdateCoreAsync(userId, request, cancellationToken),
            cancellationToken);
    }

    public Task<AdminUserManagementResult> DeleteAsync(
        Guid userId,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        return ExecuteSerializableAsync(
            () => DeleteCoreAsync(userId, currentUserId, cancellationToken),
            cancellationToken);
    }

    private async Task<AdminUserManagementResult> UpdateCoreAsync(
        Guid userId,
        UpdateUserRequest request,
        CancellationToken cancellationToken)
    {
        if (!request.Role.HasValue || !Enum.IsDefined(request.Role.Value))
        {
            return new(AdminUserManagementResultType.InvalidRole);
        }

        var user = await dbContext.Users.SingleOrDefaultAsync(
            user => user.Id == userId,
            cancellationToken);

        if (user is null)
        {
            return new(AdminUserManagementResultType.UserNotFound);
        }

        if (user.Role == UserRole.Admin &&
            user.Status == UserStatus.Active &&
            request.Role.Value != UserRole.Admin &&
            await CountActiveAdminsAsync(cancellationToken) <= 1)
        {
            return new(AdminUserManagementResultType.LastActiveAdmin);
        }

        var email = request.Email.Trim();
        var normalizedEmail = email.ToUpperInvariant();
        var duplicateEmailExists = await dbContext.Users
            .AsNoTracking()
            .AnyAsync(
                otherUser =>
                    otherUser.Id != userId &&
                    otherUser.NormalizedEmail == normalizedEmail,
                cancellationToken);

        if (duplicateEmailExists)
        {
            return new(AdminUserManagementResultType.DuplicateEmail);
        }

        user.FullName = request.FullName.Trim();
        user.Email = email;
        user.NormalizedEmail = normalizedEmail;
        user.Role = request.Role.Value;

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception)
            when (SqlServerErrorClassifier.IsUniqueConstraintViolation(exception))
        {
            return new(AdminUserManagementResultType.DuplicateEmail);
        }

        return new(AdminUserManagementResultType.Success, Map(user));
    }

    private async Task<AdminUserManagementResult> DeleteCoreAsync(
        Guid userId,
        Guid currentUserId,
        CancellationToken cancellationToken)
    {
        var user = await dbContext.Users.SingleOrDefaultAsync(
            user => user.Id == userId,
            cancellationToken);

        if (user is null)
        {
            return new(AdminUserManagementResultType.UserNotFound);
        }

        if (user.Id == currentUserId)
        {
            // هوية المسؤول الحالي مأخوذة من JWT لمنع تجاوز حظر الحذف الذاتي.
            return new(AdminUserManagementResultType.CannotDeleteCurrentUser);
        }

        if (user.Role == UserRole.Admin &&
            user.Status == UserStatus.Active &&
            await CountActiveAdminsAsync(cancellationToken) <= 1)
        {
            return new(AdminUserManagementResultType.LastActiveAdmin);
        }

        if (await dbContext.TaskItems.AsNoTracking().AnyAsync(
                taskItem => taskItem.CreatedByUserId == userId,
                cancellationToken))
        {
            return new(AdminUserManagementResultType.UserHasCreatedTasks);
        }

        dbContext.Users.Remove(user);

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception)
            when (SqlServerErrorClassifier.IsForeignKeyConstraintViolation(exception))
        {
            return new(AdminUserManagementResultType.UserHasCreatedTasks);
        }

        return new(AdminUserManagementResultType.Success);
    }

    private async Task<T> ExecuteSerializableAsync<T>(
        Func<Task<T>> operation,
        CancellationToken cancellationToken)
    {
        var executionStrategy = dbContext.Database.CreateExecutionStrategy();

        return await executionStrategy.ExecuteAsync(async () =>
        {
            dbContext.ChangeTracker.Clear();
            await using var transaction = await dbContext.Database.BeginTransactionAsync(
                IsolationLevel.Serializable,
                cancellationToken);

            var result = await operation();
            await transaction.CommitAsync(cancellationToken);
            return result;
        });
    }

    private Task<int> CountActiveAdminsAsync(CancellationToken cancellationToken)
    {
        return dbContext.Users
            .AsNoTracking()
            .CountAsync(
                user => user.Role == UserRole.Admin && user.Status == UserStatus.Active,
                cancellationToken);
    }

    private static System.Linq.Expressions.Expression<Func<User, AdminUserDto>> MapProjection()
    {
        return user => new AdminUserDto(
            user.Id,
            user.FullName,
            user.Email,
            user.Role,
            user.Status,
            user.CreatedAtUtc,
            user.UpdatedAtUtc);
    }

    private static AdminUserDto Map(User user)
    {
        return new AdminUserDto(
            user.Id,
            user.FullName,
            user.Email,
            user.Role,
            user.Status,
            user.CreatedAtUtc,
            user.UpdatedAtUtc);
    }
}
