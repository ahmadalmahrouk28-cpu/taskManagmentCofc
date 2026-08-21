namespace taskManagmentCofc.Server.Services;

public sealed class SmtpOptions
{
    public const string SectionName = "Smtp";

    public string Host { get; init; } = string.Empty;

    public int Port { get; init; } = 587;

    public string Username { get; init; } = string.Empty;

    public string Password { get; init; } = string.Empty;

    public string FromEmail { get; init; } = string.Empty;

    public string FromName { get; init; } = "Task Management";

    public bool EnableSsl { get; init; } = true;

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(Host) &&
        Port is > 0 and <= 65535 &&
        !string.IsNullOrWhiteSpace(FromEmail);

    public IReadOnlyList<string> GetMissingRequiredSettings()
    {
        var missingSettings = new List<string>();

        if (string.IsNullOrWhiteSpace(Host))
        {
            missingSettings.Add("Smtp:Host");
        }

        if (Port is <= 0 or > 65535)
        {
            missingSettings.Add("Smtp:Port");
        }

        if (string.IsNullOrWhiteSpace(FromEmail))
        {
            missingSettings.Add("Smtp:FromEmail");
        }

        return missingSettings;
    }
}
