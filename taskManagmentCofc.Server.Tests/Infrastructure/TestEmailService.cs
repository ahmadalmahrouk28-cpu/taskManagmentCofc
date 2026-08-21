using taskManagmentCofc.Server.Services.Interfaces;

namespace taskManagmentCofc.Server.Tests.Infrastructure;

internal sealed class TestEmailService : IEmailService
{
    public List<SentEmail> SentEmails { get; } = [];

    public Task SendAsync(
        string recipientEmail,
        string subject,
        string body,
        CancellationToken cancellationToken = default)
    {
        SentEmails.Add(new SentEmail(recipientEmail, subject, body));
        return Task.CompletedTask;
    }

    public void Clear()
    {
        SentEmails.Clear();
    }
}

internal sealed record SentEmail(string RecipientEmail, string Subject, string Body);
