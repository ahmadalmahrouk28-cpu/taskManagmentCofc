using taskManagmentCofc.Server.DTOs.Auth;

namespace taskManagmentCofc.Server.Services.Interfaces;

public interface IAuthService
{
    Task<RegistrationResult> RegisterAsync(
        RegisterRequest request,
        CancellationToken cancellationToken = default);

    Task<LoginResult> LoginAsync(
        LoginRequest request,
        CancellationToken cancellationToken = default);

    Task<AuthUserDto?> GetCurrentUserAsync(
        Guid userId,
        CancellationToken cancellationToken = default);
}
