using taskManagmentCofc.Server.DTOs.Tasks;

namespace taskManagmentCofc.Server.Services;

public enum TaskManagementResultType
{
    Success,
    TaskNotFound,
    AssigneeNotFound,
    AssigneeNotEmployee,
    AssigneeNotActive,
    InvalidStatus,
    EmployeeStatusNotAllowed
}

public sealed record TaskManagementResult(
    TaskManagementResultType Type,
    TaskDetailsDto? Task = null);
