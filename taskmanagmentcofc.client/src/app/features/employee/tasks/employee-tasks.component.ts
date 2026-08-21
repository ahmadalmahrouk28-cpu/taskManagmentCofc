import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder } from '@angular/forms';
import { debounceTime, finalize } from 'rxjs';
import { TaskItemStatus, TaskListItem } from '../../../core/models/task.models';
import { TasksService } from '../../../core/services/tasks.service';

@Component({
  selector: 'app-employee-tasks',
  standalone: false,
  template: `
    <header class="mb-4">
      <h1 class="h3 fw-bold mb-1">مهامي</h1>
      <p class="text-secondary mb-0">المهام المسندة إليك وحالتها الحالية.</p>
    </header>

    <div class="alert alert-success" role="status" *ngIf="successMessage">{{ successMessage }}</div>
    <div class="alert alert-danger" role="alert" *ngIf="errorMessage">{{ errorMessage }}</div>

    <form class="card content-card card-body mb-4" [formGroup]="filters">
      <div class="row g-3">
        <div class="col-12 col-md-8">
          <label for="employee-task-search" class="form-label">البحث</label>
          <input id="employee-task-search" class="form-control" formControlName="search"
                 placeholder="ابحث في العنوان أو الوصف">
        </div>
        <div class="col-12 col-md-4">
          <label for="employee-task-status" class="form-label">الحالة</label>
          <select id="employee-task-status" class="form-select" formControlName="status">
            <option [ngValue]="0">كل الحالات</option>
            <option *ngFor="let status of statuses" [ngValue]="status">{{ status | taskStatusLabel }}</option>
          </select>
        </div>
      </div>
    </form>

    <div class="d-flex align-items-center gap-2 text-secondary" role="status" *ngIf="isLoading">
      <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
      <span>جارٍ تحميل المهام...</span>
    </div>

    <div class="alert alert-light border" *ngIf="!isLoading && !errorMessage && tasks.length === 0">
      لا توجد مهام معيّنة لك حاليًا.
    </div>

    <section class="row g-3" *ngIf="!isLoading && tasks.length > 0">
      <div class="col-12 col-xl-6" *ngFor="let task of tasks; trackBy: trackById">
        <article class="card content-card h-100">
          <div class="card-body d-flex flex-column">
            <div class="d-flex justify-content-between gap-3 align-items-start mb-2">
              <h2 class="h5 mb-0">{{ task.title }}</h2>
              <span class="badge text-bg-light border">{{ task.status | taskStatusLabel }}</span>
            </div>
            <p class="text-secondary task-description">{{ task.description }}</p>
            <div class="mt-auto d-flex justify-content-between align-items-center gap-3">
              <small class="text-secondary">{{ task.createdAtUtc | date:'short' }}</small>
              <a class="btn btn-outline-primary btn-sm" [routerLink]="[task.id]">عرض التفاصيل</a>
            </div>
          </div>
        </article>
      </div>
    </section>
  `,
  styles: [`
    .task-description {
      display: -webkit-box;
      overflow: hidden;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 3;
    }
  `]
})
export class EmployeeTasksComponent implements OnInit {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  readonly statuses = [TaskItemStatus.Pending, TaskItemStatus.InProgress, TaskItemStatus.Completed];
  readonly filters = this.formBuilder.group({ search: '', status: 0 });

  tasks: TaskListItem[] = [];
  isLoading = true;
  successMessage = '';
  errorMessage = '';

  constructor(private readonly tasksService: TasksService) { }

  ngOnInit(): void {
    this.filters.valueChanges.pipe(
      debounceTime(300),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.loadTasks());
    this.loadTasks();
  }

  loadTasks(): void {
    const value = this.filters.getRawValue();
    this.isLoading = true;
    this.errorMessage = '';

    this.tasksService.getTasks(
      value.search,
      value.status === 0 ? undefined : value.status
    ).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        this.isLoading = false;
        this.changeDetectorRef.markForCheck();
      })
    ).subscribe({
      next: tasks => this.tasks = tasks,
      error: () => this.errorMessage = 'تعذر تحميل المهام. حاول مرة أخرى.'
    });
  }

  trackById(_index: number, task: TaskListItem): string {
    return task.id;
  }
}
