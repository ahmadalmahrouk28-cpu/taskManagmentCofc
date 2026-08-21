namespace taskManagmentCofc.Server.Services.Interfaces;

public interface IEmailService
{
    Task SendAsync(
        string recipientEmail,
        string subject,
        string body,
        CancellationToken cancellationToken = default);
}
