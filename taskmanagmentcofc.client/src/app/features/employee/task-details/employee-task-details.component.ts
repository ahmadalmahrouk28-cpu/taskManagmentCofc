import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { TaskDetails, TaskItemStatus } from '../../../core/models/task.models';
import { TasksService } from '../../../core/services/tasks.service';

@Component({
  selector: 'app-employee-task-details',
  standalone: false,
  template: `
    <a routerLink="/employee/tasks" class="d-inline-block mb-3">العودة إلى المهام</a>

    <div class="alert alert-success" role="status" *ngIf="successMessage">{{ successMessage }}</div>
    <div class="alert alert-danger" role="alert" *ngIf="errorMessage">{{ errorMessage }}</div>
    <div class="d-flex align-items-center gap-2 text-secondary" role="status" *ngIf="isLoading">
      <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
      <span>جارٍ تحميل تفاصيل المهمة...</span>
    </div>

    <article class="card content-card" *ngIf="task && !isLoading">
      <div class="card-body p-4">
        <div class="d-flex flex-wrap justify-content-between gap-3 mb-3">
          <div>
            <h1 class="h3 fw-bold mb-2">{{ task.title }}</h1>
            <span class="badge text-bg-light border">{{ task.status | taskStatusLabel }}</span>
          </div>
          <form class="d-flex flex-wrap align-items-end gap-2" [formGroup]="statusForm">
            <div>
              <label for="employee-status-update" class="form-label">تحديث الحالة</label>
              <select id="employee-status-update" class="form-select" formControlName="status"
                      (change)="updateStatus()">
                <option *ngFor="let status of allowedStatuses" [ngValue]="status">{{ status | taskStatusLabel }}</option>
              </select>
            </div>
            <span class="text-secondary pb-2" *ngIf="isSavingStatus" role="status">
              <span class="spinner-border spinner-border-sm ms-1" aria-hidden="true"></span>
              جارٍ حفظ الحالة...
            </span>
          </form>
        </div>

        <section class="mb-4">
          <h2 class="h6 text-secondary">الوصف</h2>
          <p class="mb-0" style="white-space: pre-line">{{ task.description }}</p>
        </section>

        <dl class="row mb-0 border-top pt-3">
          <dt class="col-sm-3">تاريخ الإنشاء</dt>
          <dd class="col-sm-9">{{ task.createdAtUtc | date:'medium' }}</dd>
          <dt class="col-sm-3">آخر تحديث</dt>
          <dd class="col-sm-9">{{ task.updatedAtUtc | date:'medium' }}</dd>
        </dl>
      </div>
    </article>
  `
})
export class EmployeeTaskDetailsComponent implements OnInit {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  readonly allowedStatuses = [TaskItemStatus.InProgress, TaskItemStatus.Completed];
  readonly statusForm = this.formBuilder.group({ status: TaskItemStatus.InProgress });

  task: TaskDetails | null = null;
  isLoading = true;
  isSavingStatus = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly tasksService: TasksService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage = 'المهمة غير موجودة أو لا تملك صلاحية الوصول إليها.';
      this.isLoading = false;
      return;
    }

    this.tasksService.getTask(id).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        this.isLoading = false;
        this.changeDetectorRef.markForCheck();
      })
    ).subscribe({
      next: task => {
        this.task = task;
        this.statusForm.controls.status.setValue(
          task.status === TaskItemStatus.Completed ? TaskItemStatus.Completed : TaskItemStatus.InProgress
        );
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = error.status === 404
          ? 'المهمة غير موجودة أو لا تملك صلاحية الوصول إليها.'
          : 'تعذر تحميل تفاصيل المهمة. حاول مرة أخرى.';
      }
    });
  }

  updateStatus(): void {
    if (!this.task) {
      return;
    }

    const status = this.statusForm.getRawValue().status;
    if (status === this.task.status || this.isSavingStatus) {
      return;
    }

    this.isSavingStatus = true;
    this.statusForm.controls.status.disable({ emitEvent: false });
    this.successMessage = '';
    this.errorMessage = '';
    this.tasksService.updateStatus(this.task.id, status).pipe(
      finalize(() => {
        this.isSavingStatus = false;
        this.statusForm.controls.status.enable({ emitEvent: false });
        this.changeDetectorRef.markForCheck();
      })
    ).subscribe({
      next: task => {
        this.task = task;
        this.statusForm.controls.status.setValue(task.status);
        this.successMessage = 'تم تحديث حالة المهمة بنجاح.';
      },
      error: (error: HttpErrorResponse) => {
        this.statusForm.controls.status.setValue(this.task!.status);
        this.errorMessage = error.status === 404
          ? 'المهمة غير موجودة أو لا تملك صلاحية الوصول إليها.'
          : 'تعذر تحديث حالة المهمة.';
      }
    });
  }
}
