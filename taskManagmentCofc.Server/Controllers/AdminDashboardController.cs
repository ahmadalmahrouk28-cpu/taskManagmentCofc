using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using taskManagmentCofc.Server.DTOs.Dashboard;
using taskManagmentCofc.Server.Enums;
using taskManagmentCofc.Server.Services.Interfaces;

namespace taskManagmentCofc.Server.Controllers;

[ApiController]
[Authorize(Roles = nameof(UserRole.Admin))]
[Route("api/admin/dashboard")]
public sealed class AdminDashboardController(
    IAdminDashboardService adminDashboardService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(AdminDashboardDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<AdminDashboardDto>> Get(
        CancellationToken cancellationToken)
    {
        return Ok(await adminDashboardService.GetAsync(cancellationToken));
    }

    [HttpGet("task-statistics")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    [ProducesResponseType(typeof(IReadOnlyList<EmployeeTaskStatisticsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<IReadOnlyList<EmployeeTaskStatisticsDto>>> GetTaskStatistics(
        CancellationToken cancellationToken)
    {
        return Ok(await adminDashboardService.GetEmployeeTaskStatisticsAsync(cancellationToken));
    }
}
