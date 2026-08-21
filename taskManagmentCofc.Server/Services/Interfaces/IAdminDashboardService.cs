using taskManagmentCofc.Server.DTOs.Dashboard;

namespace taskManagmentCofc.Server.Services.Interfaces;

public interface IAdminDashboardService
{
    Task<AdminDashboardDto> GetAsync(CancellationToken cancellationToken = default);

    Task<IReadOnlyList<EmployeeTaskStatisticsDto>> GetEmployeeTaskStatisticsAsync(
        CancellationToken cancellationToken = default);
}
