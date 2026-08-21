import { ChangeDetectorRef, Component, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { EmployeeTaskStatistics } from '../../../core/models/dashboard.models';
import { AdminDashboardService } from '../../../core/services/admin-dashboard.service';

@Component({
  selector: 'app-admin-task-statistics',
  standalone: false,
  template: `
    <header class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
      <div>
        <h1 class="h3 fw-bold mb-1">إحصائية المهام</h1>
        <p class="text-secondary mb-0">توزيع مهام كل موظف حسب الحالة الحالية.</p>
      </div>
      <button type="button" class="btn btn-outline-primary" (click)="loadStatistics()" [disabled]="isLoading">
        {{ isLoading ? 'جارٍ التحديث...' : 'تحديث الإحصائية' }}
      </button>
    </header>

    <div class="alert alert-danger" role="alert" *ngIf="errorMessage">
      {{ errorMessage }}
    </div>

    <div class="d-flex align-items-center gap-2 text-secondary" role="status" *ngIf="isLoading">
      <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
      <span>جارٍ تحميل إحصائية المهام...</span>
    </div>

    <div class="alert alert-light border" *ngIf="!isLoading && !errorMessage && statistics.length === 0">
      لا يوجد موظفون لعرض إحصائياتهم حاليًا.
    </div>

    <section *ngIf="!isLoading && !errorMessage && statistics.length > 0">
      <div class="statistics-summary mb-4">
        <div>
          <span class="summary-label">عدد الموظفين</span>
          <strong class="summary-value">{{ statistics.length }}</strong>
        </div>
        <div>
          <span class="summary-label">إجمالي المهام المسندة</span>
          <strong class="summary-value">{{ totalAssignedTasks }}</strong>
        </div>
      </div>

      <div class="card content-card overflow-hidden d-none d-lg-block">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>الموظف</th>
                <th class="text-center">إجمالي المهام</th>
                <th class="text-center">قيد الانتظار</th>
                <th class="text-center">قيد الإنجاز</th>
                <th class="text-center">المكتملة</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of statistics; trackBy: trackByEmployeeId">
                <td>
                  <div class="d-flex align-items-center gap-3">
                    <span class="employee-avatar" aria-hidden="true">{{ item.fullName.charAt(0) }}</span>
                    <div>
                      <div class="fw-bold">{{ item.fullName }}</div>
                      <small class="text-secondary">{{ item.email }}</small>
                    </div>
                  </div>
                </td>
                <td class="text-center"><span class="count-pill count-total">{{ item.totalTasks }}</span></td>
                <td class="text-center"><span class="count-pill count-pending">{{ item.pendingTasks }}</span></td>
                <td class="text-center"><span class="count-pill count-progress">{{ item.inProgressTasks }}</span></td>
                <td class="text-center"><span class="count-pill count-completed">{{ item.completedTasks }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="d-grid gap-3 d-lg-none">
        <article class="card content-card employee-stat-card"
                 *ngFor="let item of statistics; trackBy: trackByEmployeeId">
          <div class="card-body p-4">
            <div class="d-flex align-items-center gap-3 mb-4">
              <span class="employee-avatar" aria-hidden="true">{{ item.fullName.charAt(0) }}</span>
              <div class="min-width-0">
                <h2 class="h6 fw-bold mb-1 text-truncate">{{ item.fullName }}</h2>
                <div class="small text-secondary text-truncate">{{ item.email }}</div>
              </div>
            </div>
            <div class="mobile-stat-grid">
              <div class="mobile-stat"><span>الإجمالي</span><strong>{{ item.totalTasks }}</strong></div>
              <div class="mobile-stat"><span>قيد الانتظار</span><strong>{{ item.pendingTasks }}</strong></div>
              <div class="mobile-stat"><span>قيد الإنجاز</span><strong>{{ item.inProgressTasks }}</strong></div>
              <div class="mobile-stat"><span>المكتملة</span><strong>{{ item.completedTasks }}</strong></div>
            </div>
          </div>
        </article>
      </div>
    </section>
  `,
  styles: [`
    .statistics-summary {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1rem;
    }

    .statistics-summary > div {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem 1.25rem;
      border: 1px solid var(--app-border);
      border-radius: 1rem;
      background: linear-gradient(135deg, rgb(var(--bs-primary-rgb) / 10%), var(--app-surface));
    }

    .summary-label { color: var(--app-muted); font-weight: 600; }
    .summary-value { color: var(--app-primary); font-size: 1.5rem; }

    .employee-avatar {
      display: inline-grid;
      flex: 0 0 42px;
      width: 42px;
      height: 42px;
      color: white;
      border-radius: 14px;
      background: linear-gradient(135deg, var(--app-primary), var(--app-accent));
      box-shadow: 0 8px 20px rgb(var(--bs-primary-rgb) / 24%);
      font-weight: 800;
      place-items: center;
    }

    .count-pill {
      display: inline-grid;
      min-width: 46px;
      min-height: 38px;
      padding: 0.4rem 0.75rem;
      border-radius: 12px;
      font-weight: 800;
      place-items: center;
    }

    .count-total { color: var(--app-primary); background: rgb(var(--bs-primary-rgb) / 12%); }
    .count-pending { color: var(--app-warning); background: color-mix(in srgb, var(--app-warning) 12%, transparent); }
    .count-progress { color: var(--app-secondary); background: color-mix(in srgb, var(--app-secondary) 12%, transparent); }
    .count-completed { color: var(--app-success); background: color-mix(in srgb, var(--app-success) 12%, transparent); }

    .mobile-stat-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.75rem;
    }

    .mobile-stat {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding: 0.85rem;
      border: 1px solid var(--app-border);
      border-radius: 0.85rem;
      background: var(--app-surface-soft);
    }

    .mobile-stat span { color: var(--app-muted); font-size: 0.82rem; }
    .mobile-stat strong { color: var(--app-primary); font-size: 1.25rem; }
    .min-width-0 { min-width: 0; }

    @media (max-width: 575.98px) {
      .statistics-summary { grid-template-columns: 1fr; }
    }
  `]
})
export class AdminTaskStatisticsComponent implements OnInit {
  statistics: EmployeeTaskStatistics[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(
    private readonly dashboardService: AdminDashboardService,
    private readonly destroyRef: DestroyRef,
    private readonly changeDetectorRef: ChangeDetectorRef
  ) { }

  get totalAssignedTasks(): number {
    return this.statistics.reduce((total, item) => total + item.totalTasks, 0);
  }

  ngOnInit(): void {
    this.loadStatistics();
  }

  loadStatistics(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.dashboardService.getTaskStatistics().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        this.isLoading = false;
        this.changeDetectorRef.markForCheck();
      })
    ).subscribe({
      next: statistics => this.statistics = statistics,
      error: () => this.errorMessage = 'تعذر تحميل إحصائية المهام. حاول مرة أخرى.'
    });
  }

  trackByEmployeeId(_index: number, item: EmployeeTaskStatistics): string {
    return item.employeeId;
  }
}
