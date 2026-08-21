namespace taskManagmentCofc.Server.DTOs.Tasks;

public sealed record TaskAssigneeDto(
    Guid Id,
    string FullName,
    string Email);
