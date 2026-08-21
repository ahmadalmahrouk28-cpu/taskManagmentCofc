import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminDashboard } from '../../../core/models/dashboard.models';
import { AdminDashboardService } from '../../../core/services/admin-dashboard.service';

interface DashboardMetric {
  label: string;
  value: number;
  tone: string;
  symbol: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: false,
  template: `
    <header class="mb-4">
      <h1 class="h3 fw-bold mb-1">لوحة التحكم</h1>
      <p class="text-secondary mb-0">ملخص المستخدمين والمهام في النظام.</p>
    </header>

    <div class="alert alert-danger" role="alert" *ngIf="errorMessage">{{ errorMessage }}</div>
    <div class="d-flex align-items-center gap-2 text-secondary" role="status" *ngIf="isLoading">
      <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
      <span>جارٍ تحميل الإحصاءات...</span>
    </div>

    <section class="row g-3" *ngIf="!isLoading && !errorMessage">
      <div class="col-12 col-sm-6 col-xl-4" *ngFor="let metric of metrics">
        <article class="card content-card metric-card h-100" [ngClass]="metric.tone">
          <div class="card-body p-4">
            <div class="d-flex justify-content-between align-items-start">
              <span class="metric-symbol" aria-hidden="true">{{ metric.symbol }}</span>
              <span class="badge rounded-pill text-bg-light border">بيانات النظام</span>
            </div>
            <div class="metric-value">{{ metric.value }}</div>
            <div class="text-secondary fw-semibold">{{ metric.label }}</div>
          </div>
        </article>
      </div>
    </section>
  `
})
export class AdminDashboardComponent implements OnInit {
  metrics: DashboardMetric[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(
    private readonly dashboardService: AdminDashboardService,
    private readonly destroyRef: DestroyRef,
    private readonly changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.dashboardService.getDashboard().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: dashboard => {
        this.metrics = this.toMetrics(dashboard);
        this.isLoading = false;
        this.changeDetectorRef.markForCheck();
      },
      error: (_error: HttpErrorResponse) => {
        this.errorMessage = 'تعذر تحميل بيانات لوحة التحكم.';
        this.isLoading = false;
        this.changeDetectorRef.markForCheck();
      }
    });
  }

  private toMetrics(value: AdminDashboard): DashboardMetric[] {
    return [
      { label: 'إجمالي المهام', value: value.totalTasks, tone: 'metric-primary', symbol: '≡' },
      { label: 'قيد الانتظار', value: value.pendingTasks, tone: 'metric-warning', symbol: '◷' },
      { label: 'قيد الإنجاز', value: value.inProgressTasks, tone: 'metric-info', symbol: '↗' },
      { label: 'المهام المكتملة', value: value.completedTasks, tone: 'metric-success', symbol: '✓' },
      { label: 'الموظفون النشطون', value: value.activeEmployees, tone: 'metric-accent', symbol: '●' },
      { label: 'طلبات التسجيل المعلقة', value: value.pendingRegistrations, tone: 'metric-danger', symbol: '+' }
    ];
  }
}
