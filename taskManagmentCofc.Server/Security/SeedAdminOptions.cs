namespace taskManagmentCofc.Server.Security;

public sealed class SeedAdminOptions
{
    public const string SectionName = "SeedAdmin";

    public string FullName { get; set; } = "System Admin";

    public string Email { get; set; } = "admin@example.com";

    public string? Password { get; set; }
}
