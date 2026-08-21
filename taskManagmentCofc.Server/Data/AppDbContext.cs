using Microsoft.EntityFrameworkCore;
using taskManagmentCofc.Server.Common;
using taskManagmentCofc.Server.Entities;

namespace taskManagmentCofc.Server.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options)
    : DbContext(options)
{
    public DbSet<User> Users => Set<User>();

    public DbSet<TaskItem> TaskItems => Set<TaskItem>();

    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }

    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        NormalizeUserEmails();
        ApplyAuditValues();
        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    public override Task<int> SaveChangesAsync(
        bool acceptAllChangesOnSuccess,
        CancellationToken cancellationToken = default)
    {
        NormalizeUserEmails();
        ApplyAuditValues();
        return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

    private void NormalizeUserEmails()
    {
        var userEntries = ChangeTracker.Entries<User>()
            .Where(entry => entry.State is EntityState.Added or EntityState.Modified);

        foreach (var entry in userEntries)
        {
            // يُشتق البريد المطبّع مركزيًا لمنع تجاوز التفرد باختلاف حالة الأحرف.
            entry.Entity.Email = entry.Entity.Email.Trim();
            entry.Entity.NormalizedEmail = entry.Entity.Email.ToUpperInvariant();
        }
    }

    private void ApplyAuditValues()
    {
        var now = DateTime.UtcNow;

        foreach (var entry in ChangeTracker.Entries<ICreationTrackedEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAtUtc = now;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Property(entity => entity.CreatedAtUtc).IsModified = false;
            }

            if (entry.Entity is IAuditableEntity auditableEntity &&
                entry.State is EntityState.Added or EntityState.Modified)
            {
                auditableEntity.UpdatedAtUtc = now;
            }
        }
    }
}
