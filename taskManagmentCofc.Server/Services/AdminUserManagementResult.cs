using taskManagmentCofc.Server.DTOs.Users;

namespace taskManagmentCofc.Server.Services;

public enum AdminUserManagementResultType
{
    Success,
    UserNotFound,
    DuplicateEmail,
    PasswordMismatch,
    InvalidRole,
    CannotDeleteCurrentUser,
    LastActiveAdmin,
    UserHasCreatedTasks
}

public sealed record AdminUserManagementResult(
    AdminUserManagementResultType Type,
    AdminUserDto? User = null);
