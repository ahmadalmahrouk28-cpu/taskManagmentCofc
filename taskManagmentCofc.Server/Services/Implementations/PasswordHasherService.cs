using System.Security.Cryptography;
using Microsoft.AspNetCore.Identity;
using taskManagmentCofc.Server.Entities;
using taskManagmentCofc.Server.Services.Interfaces;

namespace taskManagmentCofc.Server.Services.Implementations;

public sealed class PasswordHasherService : IPasswordHasherService
{
    private readonly PasswordHasher<User> _passwordHasher = new();
    private readonly User _dummyUser = new();
    private readonly string _dummyPasswordHash;

    public PasswordHasherService()
    {
        var dummyPassword = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
        _dummyPasswordHash = _passwordHasher.HashPassword(_dummyUser, dummyPassword);
    }

    public string HashPassword(User user, string password)
    {
        return _passwordHasher.HashPassword(user, password);
    }

    public PasswordVerificationResult VerifyPassword(
        User? user,
        string? passwordHash,
        string providedPassword)
    {
        // تُنفذ عملية تحقق مماثلة للحساب غير الموجود لتقليل كشف البريد عبر فرق التوقيت.
        var verificationUser = user ?? _dummyUser;
        var verificationHash = string.IsNullOrWhiteSpace(passwordHash)
            ? _dummyPasswordHash
            : passwordHash;

        return _passwordHasher.VerifyHashedPassword(
            verificationUser,
            verificationHash,
            providedPassword);
    }
}
