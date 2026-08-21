using taskManagmentCofc.Server.Entities;
using taskManagmentCofc.Server.Security;

namespace taskManagmentCofc.Server.Services.Interfaces;

public interface IJwtTokenService
{
    JwtTokenResult CreateAccessToken(User user);
}
