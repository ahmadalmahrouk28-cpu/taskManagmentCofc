using taskManagmentCofc.Server.DTOs.Users;
using taskManagmentCofc.Server.Enums;

namespace taskManagmentCofc.Server.Services.Interfaces;

public interface IAdminUserService
{
    Task<IReadOnlyList<AdminUserDto>> GetAllAsync(
        string? search,
        UserRole? role,
        UserStatus? status,
        CancellationToken cancellationToken = default);

    Task<AdminUserDto?> GetByIdAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<AdminUserManagementResult> CreateAsync(
        CreateUserRequest request,
        CancellationToken cancellationToken = default);

    Task<AdminUserManagementResult> UpdateAsync(
        Guid userId,
        UpdateUserRequest request,
        CancellationToken cancellationToken = default);

    Task<AdminUserManagementResult> DeleteAsync(
        Guid userId,
        Guid currentUserId,
        CancellationToken cancellationToken = default);
}
