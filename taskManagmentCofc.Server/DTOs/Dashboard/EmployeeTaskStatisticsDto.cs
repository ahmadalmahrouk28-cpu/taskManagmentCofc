namespace taskManagmentCofc.Server.DTOs.Dashboard;

public sealed record EmployeeTaskStatisticsDto(
    Guid EmployeeId,
    string FullName,
    string Email,
    int TotalTasks,
    int PendingTasks,
    int InProgressTasks,
    int CompletedTasks);
