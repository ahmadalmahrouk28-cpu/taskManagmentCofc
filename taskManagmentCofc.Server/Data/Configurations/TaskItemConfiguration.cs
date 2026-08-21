using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using taskManagmentCofc.Server.Entities;

namespace taskManagmentCofc.Server.Data.Configurations;

public sealed class TaskItemConfiguration : IEntityTypeConfiguration<TaskItem>
{
    public void Configure(EntityTypeBuilder<TaskItem> builder)
    {
        builder.ToTable("TaskItems", tableBuilder =>
            tableBuilder.HasCheckConstraint("CK_TaskItems_Status", "[Status] IN (1, 2, 3)"));

        builder.HasKey(taskItem => taskItem.Id);

        builder.Property(taskItem => taskItem.Title)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(taskItem => taskItem.Description)
            .HasMaxLength(4000)
            .IsRequired();

        builder.Property(taskItem => taskItem.CreatedAtUtc)
            .HasColumnType("datetime2");

        builder.Property(taskItem => taskItem.UpdatedAtUtc)
            .HasColumnType("datetime2");

        // حذف الموظف يفصل الإسناد فقط ويحافظ على سجل المهمة.
        builder.HasOne(taskItem => taskItem.AssignedToUser)
            .WithMany(user => user.AssignedTasks)
            .HasForeignKey(taskItem => taskItem.AssignedToUserId)
            .OnDelete(DeleteBehavior.SetNull);

        // منشئ المهمة جزء من سجلها ولا يؤدي حذفه إلى حذف المهام.
        builder.HasOne(taskItem => taskItem.CreatedByUser)
            .WithMany(user => user.CreatedTasks)
            .HasForeignKey(taskItem => taskItem.CreatedByUserId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasIndex(taskItem => new { taskItem.AssignedToUserId, taskItem.Status })
            .HasDatabaseName("IX_TaskItems_AssignedToUserId_Status");

        builder.HasIndex(taskItem => taskItem.CreatedByUserId)
            .HasDatabaseName("IX_TaskItems_CreatedByUserId");
    }
}
