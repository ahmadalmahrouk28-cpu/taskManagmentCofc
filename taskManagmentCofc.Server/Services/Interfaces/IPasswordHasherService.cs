using Microsoft.AspNetCore.Identity;
using taskManagmentCofc.Server.Entities;

namespace taskManagmentCofc.Server.Services.Interfaces;

public interface IPasswordHasherService
{
    string HashPassword(User user, string password);

    PasswordVerificationResult VerifyPassword(
        User? user,
        string? passwordHash,
        string providedPassword);
}
