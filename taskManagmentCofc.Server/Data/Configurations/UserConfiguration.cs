using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using taskManagmentCofc.Server.Entities;

namespace taskManagmentCofc.Server.Data.Configurations;

public sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users", tableBuilder =>
        {
            tableBuilder.HasCheckConstraint("CK_Users_Role", "[Role] IN (1, 2)");
            tableBuilder.HasCheckConstraint("CK_Users_Status", "[Status] IN (1, 2, 3)");
        });

        builder.HasKey(user => user.Id);

        builder.Property(user => user.FullName)
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(user => user.Email)
            .HasMaxLength(256)
            .IsRequired();

        builder.Property(user => user.NormalizedEmail)
            .HasMaxLength(256)
            .IsRequired();

        builder.Property(user => user.PasswordHash)
            .HasMaxLength(512)
            .IsRequired();

        builder.Property(user => user.RejectionReason)
            .HasMaxLength(1000);

        builder.Property(user => user.CreatedAtUtc)
            .HasColumnType("datetime2");

        builder.Property(user => user.UpdatedAtUtc)
            .HasColumnType("datetime2");

        builder.HasIndex(user => user.NormalizedEmail)
            .IsUnique()
            .HasDatabaseName("UX_Users_NormalizedEmail");

        builder.HasIndex(user => new { user.Role, user.Status })
            .HasDatabaseName("IX_Users_Role_Status");
    }
}
