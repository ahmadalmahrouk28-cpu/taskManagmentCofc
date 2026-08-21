using taskManagmentCofc.Server.DTOs.Users;

namespace taskManagmentCofc.Server.Services.Interfaces;

public interface IRegistrationManagementService
{
    Task<IReadOnlyList<PendingRegistrationDto>> GetPendingAsync(
        CancellationToken cancellationToken = default);

    Task<RegistrationManagementResult> ApproveAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<RegistrationManagementResult> RejectAsync(
        Guid userId,
        string reason,
        CancellationToken cancellationToken = default);
}
