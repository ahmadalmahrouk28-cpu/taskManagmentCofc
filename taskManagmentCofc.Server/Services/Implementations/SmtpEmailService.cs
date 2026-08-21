using System.Net;
using System.Net.Mail;
using System.Text;
using Microsoft.Extensions.Options;
using taskManagmentCofc.Server.Services.Interfaces;

namespace taskManagmentCofc.Server.Services.Implementations;

public sealed class SmtpEmailService(
    IOptions<SmtpOptions> smtpOptions,
    ILogger<SmtpEmailService> logger) : IEmailService
{
    private readonly SmtpOptions _smtpOptions = smtpOptions.Value;

    public async Task SendAsync(
        string recipientEmail,
        string subject,
        string body,
        CancellationToken cancellationToken = default)
    {
        if (!_smtpOptions.IsConfigured)
        {
            logger.LogWarning(
                "SMTP is not configured. Email notification was skipped. Missing settings: {MissingSettings}",
                string.Join(", ", _smtpOptions.GetMissingRequiredSettings()));
            return;
        }

        try
        {
            using var message = new MailMessage
            {
                From = new MailAddress(_smtpOptions.FromEmail, _smtpOptions.FromName),
                Subject = subject,
                Body = body,
                IsBodyHtml = false,
                SubjectEncoding = Encoding.UTF8,
                BodyEncoding = Encoding.UTF8,
                HeadersEncoding = Encoding.UTF8
            };
            message.To.Add(new MailAddress(recipientEmail));

            using var smtpClient = new SmtpClient(_smtpOptions.Host, _smtpOptions.Port)
            {
                EnableSsl = _smtpOptions.EnableSsl,
                DeliveryMethod = SmtpDeliveryMethod.Network,
                UseDefaultCredentials = false
            };

            if (!string.IsNullOrWhiteSpace(_smtpOptions.Username))
            {
                smtpClient.Credentials = new NetworkCredential(
                    _smtpOptions.Username,
                    _smtpOptions.Password);
            }

            await smtpClient.SendMailAsync(message, cancellationToken);
            logger.LogInformation("Email notification was sent successfully.");
        }
        catch (Exception exception)
        {
            // فشل البريد لا يلغي قرار المسؤول لأن الإشعار الداخلي حُفظ مسبقًا.
            logger.LogWarning(
                "Email notification could not be sent. Error type: {ErrorType}",
                exception.GetType().Name);
        }
    }
}
