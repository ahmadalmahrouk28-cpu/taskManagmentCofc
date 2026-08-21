import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { debounceTime, finalize, fromEvent } from 'rxjs';
import { ApiErrorResponse } from '../../../core/models/api.models';
import { UserRole, UserStatus } from '../../../core/models/auth.models';
import { TaskItemStatus, TaskListItem } from '../../../core/models/task.models';
import { AdminUser } from '../../../core/models/user.models';
import { AdminUsersService } from '../../../core/services/admin-users.service';
import { TasksService } from '../../../core/services/tasks.service';

@Component({
  selector: 'app-admin-tasks',
  standalone: false,
  template: `
    <header class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
      <div>
        <h1 class="h3 fw-bold mb-1">إدارة المهام</h1>
        <p class="text-secondary mb-0">إنشاء المهام وتوزيعها ومتابعة حالاتها.</p>
      </div>
      <div class="d-flex gap-2">
        <button type="button" class="btn btn-outline-secondary" (click)="loadTasks()" [disabled]="isLoading">
          تحديث القائمة
        </button>
        <button type="button" class="btn btn-primary" (click)="openCreate()">إنشاء مهمة</button>
      </div>
    </header>

    <div class="alert alert-success" role="status" *ngIf="successMessage">{{ successMessage }}</div>
    <div class="alert alert-danger" role="alert" *ngIf="errorMessage">{{ errorMessage }}</div>

    <form class="card content-card card-body mb-4" [formGroup]="filters">
      <div class="row g-3 align-items-end">
        <div class="col-12 col-lg-5">
          <label for="task-search" class="form-label">البحث</label>
          <input id="task-search" class="form-control" formControlName="search" placeholder="العنوان أو الوصف">
        </div>
        <div class="col-12 col-md-6 col-lg-3">
          <label for="task-status-filter" class="form-label">الحالة</label>
          <select id="task-status-filter" class="form-select" formControlName="status">
            <option [ngValue]="0">كل الحالات</option>
            <option *ngFor="let status of statuses" [ngValue]="status">{{ status | taskStatusLabel }}</option>
          </select>
        </div>
        <div class="col-12 col-md-6 col-lg-4">
          <label for="task-employee-filter" class="form-label">الموظف</label>
          <select id="task-employee-filter" class="form-select" formControlName="assignedToUserId">
            <option value="">كل الموظفين</option>
            <option *ngFor="let employee of employees" [value]="employee.id">{{ employee.fullName }}</option>
          </select>
        </div>
      </div>
    </form>

    <div class="d-flex align-items-center gap-2 text-secondary" role="status" *ngIf="isLoading">
      <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
      <span>جارٍ تحميل المهام...</span>
    </div>

    <div class="alert alert-light border" *ngIf="!isLoading && !errorMessage && tasks.length === 0">
      لا توجد مهام مطابقة للبحث الحالي.
    </div>

    <div class="table-responsive" *ngIf="!isLoading && tasks.length > 0">
      <table class="table table-hover align-middle">
        <thead>
          <tr>
            <th>العنوان</th>
            <th>الموظف</th>
            <th>الحالة</th>
            <th>تاريخ الإنشاء</th>
            <th class="text-nowrap">الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let task of tasks; trackBy: trackById">
            <td>
              <div class="fw-semibold">{{ task.title }}</div>
              <small class="text-secondary d-block text-truncate task-description">{{ task.description }}</small>
            </td>
            <td>{{ task.assignedTo?.fullName || 'غير معيّن' }}</td>
            <td>
              <select class="form-select form-select-sm status-select"
                      #statusSelect (change)="changeStatus(task, statusSelect.value)">
                <option *ngFor="let status of statuses" [value]="status" [selected]="status === task.status">
                  {{ status | taskStatusLabel }}
                </option>
              </select>
            </td>
            <td class="text-nowrap">{{ task.createdAtUtc | date:'short' }}</td>
            <td>
              <div class="d-flex flex-wrap gap-2">
                <button type="button" class="btn btn-sm btn-outline-primary" (click)="openEdit(task)">تعديل</button>
                <button type="button" class="btn btn-sm btn-outline-danger" (click)="deleteTarget = task">حذف</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="modal d-block" tabindex="-1" role="dialog" aria-modal="true" *ngIf="showFormModal">
      <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title h5">{{ editingId ? 'تعديل المهمة' : 'إنشاء مهمة' }}</h2>
            <button type="button" class="btn-close" aria-label="إغلاق" (click)="closeFormModal()"></button>
          </div>
          <form [formGroup]="taskForm" (ngSubmit)="saveTask()" novalidate>
            <div class="modal-body">
              <div class="row g-3 task-form-grid">
                <div class="col-12 col-md-6">
                  <label for="task-title" class="form-label">العنوان</label>
                  <input id="task-title" class="form-control" maxlength="200" formControlName="title"
                         [class.is-invalid]="isInvalid('title')">
                  <div class="invalid-feedback">العنوان مطلوب وبحد أقصى 200 حرف.</div>
                </div>
                <div class="col-12 col-md-6">
                  <label for="task-assignee" class="form-label">الموظف المسؤول</label>
                  <select id="task-assignee" class="form-select" formControlName="assignedToUserId"
                          [class.is-invalid]="isInvalid('assignedToUserId')">
                    <option value="">اختر موظفًا</option>
                    <option *ngFor="let employee of employees" [value]="employee.id">{{ employee.fullName }}</option>
                  </select>
                  <div class="invalid-feedback">اختيار الموظف مطلوب.</div>
                </div>
                <div class="col-12" [class.col-md-8]="editingId">
                  <label for="task-description" class="form-label">الوصف</label>
                  <textarea id="task-description" class="form-control" rows="4" maxlength="4000"
                            formControlName="description" [class.is-invalid]="isInvalid('description')"></textarea>
                  <div class="invalid-feedback">الوصف مطلوب وبحد أقصى 4000 حرف.</div>
                </div>
                <div class="col-12 col-md-4" *ngIf="editingId">
                  <label for="task-edit-status" class="form-label">الحالة</label>
                  <select id="task-edit-status" class="form-select" formControlName="status">
                    <option *ngFor="let status of statuses" [ngValue]="status">{{ status | taskStatusLabel }}</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary" (click)="closeFormModal()">إلغاء</button>
              <button type="submit" class="btn btn-primary" [disabled]="isSaving">
                {{ isSaving ? 'جارٍ الحفظ...' : 'حفظ' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade show" *ngIf="showFormModal"></div>

    <div class="modal d-block" tabindex="-1" role="dialog" aria-modal="true" *ngIf="deleteTarget">
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header"><h2 class="modal-title h5">تأكيد حذف المهمة</h2></div>
          <div class="modal-body">هل تريد حذف المهمة «{{ deleteTarget.title }}»؟ لا يمكن التراجع عن هذه العملية.</div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" (click)="deleteTarget = null">إلغاء</button>
            <button type="button" class="btn btn-danger" [disabled]="isDeleting" (click)="confirmDelete()">
              {{ isDeleting ? 'جارٍ الحذف...' : 'حذف' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade show" *ngIf="deleteTarget"></div>
  `,
  styles: [`
    .task-description { max-width: 320px; }
    .status-select { min-width: 150px; }
  `]
})
export class AdminTasksComponent implements OnInit {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  readonly statuses = [TaskItemStatus.Pending, TaskItemStatus.InProgress, TaskItemStatus.Completed];
  readonly filters = this.formBuilder.group({ search: '', status: 0, assignedToUserId: '' });
  readonly taskForm = this.formBuilder.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.required, Validators.maxLength(4000)]],
    assignedToUserId: ['', Validators.required],
    status: TaskItemStatus.Pending
  });

  tasks: TaskListItem[] = [];
  employees: AdminUser[] = [];
  editingId: string | null = null;
  deleteTarget: TaskListItem | null = null;
  showFormModal = false;
  isLoading = true;
  isSaving = false;
  isDeleting = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private readonly tasksService: TasksService,
    private readonly usersService: AdminUsersService
  ) { }

  ngOnInit(): void {
    this.loadEmployees();
    this.filters.valueChanges.pipe(
      debounceTime(300),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.loadTasks());
    fromEvent(window, 'focus').pipe(
      debounceTime(150),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.loadTasks());
    this.loadTasks();
  }

  loadTasks(): void {
    const filters = this.filters.getRawValue();
    this.isLoading = true;
    this.errorMessage = '';
    this.tasksService.getTasks(
      filters.search,
      filters.status === 0 ? undefined : filters.status,
      filters.assignedToUserId || undefined
    ).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        this.isLoading = false;
        this.changeDetectorRef.markForCheck();
      })
    ).subscribe({
      next: tasks => this.tasks = tasks,
      error: () => this.errorMessage = 'تعذر تحميل المهام.'
    });
  }

  openCreate(): void {
    this.editingId = null;
    this.taskForm.reset({ title: '', description: '', assignedToUserId: '', status: TaskItemStatus.Pending });
    this.showFormModal = true;
  }

  openEdit(task: TaskListItem): void {
    this.editingId = task.id;
    this.taskForm.reset({
      title: task.title,
      description: task.description,
      assignedToUserId: task.assignedTo?.id ?? '',
      status: task.status
    });
    this.showFormModal = true;
  }

  closeFormModal(): void {
    if (!this.isSaving) {
      this.showFormModal = false;
    }
  }

  isInvalid(controlName: 'title' | 'description' | 'assignedToUserId'): boolean {
    const control = this.taskForm.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  saveTask(): void {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    const value = this.taskForm.getRawValue();
    const request = this.editingId
      ? this.tasksService.updateTask(this.editingId, value)
      : this.tasksService.createTask({
          title: value.title,
          description: value.description,
          assignedToUserId: value.assignedToUserId
        });

    this.isSaving = true;
    this.errorMessage = '';
    request.pipe(finalize(() => {
      this.isSaving = false;
      this.changeDetectorRef.markForCheck();
    })).subscribe({
      next: () => {
        this.successMessage = this.editingId ? 'تم تحديث المهمة بنجاح.' : 'تم إنشاء المهمة بنجاح.';
        this.showFormModal = false;
        this.loadTasks();
      },
      error: error => this.errorMessage = this.getErrorMessage(error, 'تعذر حفظ المهمة.')
    });
  }

  changeStatus(task: TaskListItem, value: string): void {
    const status = Number(value) as TaskItemStatus;
    if (status === task.status) {
      return;
    }

    this.tasksService.updateStatus(task.id, status).pipe(
      finalize(() => this.changeDetectorRef.markForCheck())
    ).subscribe({
      next: () => {
        task.status = status;
        this.successMessage = 'تم تحديث حالة المهمة.';
      },
      error: error => {
        this.errorMessage = this.getErrorMessage(error, 'تعذر تحديث حالة المهمة.');
        this.loadTasks();
      }
    });
  }

  confirmDelete(): void {
    if (!this.deleteTarget) {
      return;
    }

    this.isDeleting = true;
    this.tasksService.deleteTask(this.deleteTarget.id).pipe(
      finalize(() => {
        this.isDeleting = false;
        this.changeDetectorRef.markForCheck();
      })
    ).subscribe({
      next: () => {
        this.deleteTarget = null;
        this.successMessage = 'تم حذف المهمة بنجاح.';
        this.loadTasks();
      },
      error: error => this.errorMessage = this.getErrorMessage(error, 'تعذر حذف المهمة.')
    });
  }

  trackById(_index: number, task: TaskListItem): string {
    return task.id;
  }

  private loadEmployees(): void {
    this.usersService.getUsers(undefined, UserRole.Employee, UserStatus.Active).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.changeDetectorRef.markForCheck())
    ).subscribe({
      next: employees => this.employees = employees,
      error: () => this.errorMessage = 'تعذر تحميل قائمة الموظفين الفعالين.'
    });
  }

  private getErrorMessage(error: HttpErrorResponse, fallback: string): string {
    const response = error.error as ApiErrorResponse | null;
    const messages: Record<string, string> = {
      ASSIGNEE_NOT_FOUND: 'الموظف المحدد غير موجود.',
      ASSIGNEE_NOT_EMPLOYEE: 'يمكن إسناد المهمة إلى موظف فقط.',
      ASSIGNEE_NOT_ACTIVE: 'يجب أن يكون الموظف المحدد مفعّلًا.',
      TASK_NOT_FOUND: 'المهمة غير موجودة.'
    };
    return response?.code && messages[response.code] ? messages[response.code] : fallback;
  }
}
