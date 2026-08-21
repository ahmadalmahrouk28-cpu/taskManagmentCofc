namespace taskManagmentCofc.Server.DTOs.Dashboard;

public sealed record AdminDashboardDto(
    int TotalUsers,
    int TotalEmployees,
    int ActiveEmployees,
    int PendingRegistrations,
    int RejectedUsers,
    int TotalTasks,
    int PendingTasks,
    int InProgressTasks,
    int CompletedTasks);
