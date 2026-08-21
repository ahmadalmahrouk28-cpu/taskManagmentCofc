using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace taskManagmentCofc.Server.Common;

public static class SqlServerErrorClassifier
{
    public static bool IsUniqueConstraintViolation(DbUpdateException exception)
    {
        return exception.InnerException is SqlException sqlException &&
            sqlException.Number is 2601 or 2627;
    }

    public static bool IsForeignKeyConstraintViolation(DbUpdateException exception)
    {
        return exception.InnerException is SqlException { Number: 547 };
    }
}
