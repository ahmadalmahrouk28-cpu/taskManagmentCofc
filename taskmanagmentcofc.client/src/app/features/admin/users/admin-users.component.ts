import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { debounceTime, finalize } from 'rxjs';
import { ApiErrorResponse } from '../../../core/models/api.models';
import { UserRole, UserStatus } from '../../../core/models/auth.models';
import { AdminUser } from '../../../core/models/user.models';
import { AdminUsersService } from '../../../core/services/admin-users.service';
import { matchingPasswordsValidator, passwordPolicyValidator } from '../../../shared/validators/password.validators';

@Component({
  selector: 'app-admin-users',
  standalone: false,
  template: `
    <header class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
      <div>
        <h1 class="h3 fw-bold mb-1">إدارة المستخدمين</h1>
        <p class="text-secondary mb-0">إنشاء الحسابات وإدارة بيانات المستخدمين وأدوارهم.</p>
      </div>
      <button type="button" class="btn btn-primary" (click)="openCreate()">إنشاء مستخدم</button>
    </header>

    <div class="alert alert-success" role="status" *ngIf="successMessage">{{ successMessage }}</div>
    <div class="alert alert-danger" role="alert" *ngIf="errorMessage">{{ errorMessage }}</div>

    <form class="card content-card card-body mb-4" [formGroup]="filters">
      <div class="row g-3">
        <div class="col-12 col-lg-6">
          <label for="user-search" class="form-label">البحث</label>
          <input id="user-search" class="form-control" formControlName="search" placeholder="الاسم أو البريد الإلكتروني">
        </div>
        <div class="col-12 col-md-6 col-lg-3">
          <label for="user-role-filter" class="form-label">الدور</label>
          <select id="user-role-filter" class="form-select" formControlName="role">
            <option [ngValue]="0">كل الأدوار</option>
            <option *ngFor="let role of roles" [ngValue]="role">{{ role | userRoleLabel }}</option>
          </select>
        </div>
        <div class="col-12 col-md-6 col-lg-3">
          <label for="user-status-filter" class="form-label">الحالة</label>
          <select id="user-status-filter" class="form-select" formControlName="status">
            <option [ngValue]="0">كل الحالات</option>
            <option *ngFor="let status of statuses" [ngValue]="status">{{ status | userStatusLabel }}</option>
          </select>
        </div>
      </div>
    </form>

    <div class="d-flex align-items-center gap-2 text-secondary" role="status" *ngIf="isLoading">
      <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
      <span>جارٍ تحميل المستخدمين...</span>
    </div>
    <div class="alert alert-light border" *ngIf="!isLoading && !errorMessage && users.length === 0">
      لا يوجد مستخدمون مطابقون للبحث الحالي.
    </div>

    <div class="table-responsive" *ngIf="!isLoading && users.length > 0">
      <table class="table table-hover align-middle">
        <thead>
          <tr>
            <th>الاسم</th><th>البريد</th><th>الدور</th><th>الحالة</th><th>تاريخ الإنشاء</th><th>الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let user of users; trackBy: trackById">
            <td class="fw-semibold">{{ user.fullName }}</td>
            <td>{{ user.email }}</td>
            <td><span class="badge text-bg-light border">{{ user.role | userRoleLabel }}</span></td>
            <td><span class="badge text-bg-light border">{{ user.status | userStatusLabel }}</span></td>
            <td class="text-nowrap">{{ user.createdAtUtc | date:'short' }}</td>
            <td>
              <div class="d-flex flex-wrap gap-2">
                <button type="button" class="btn btn-sm btn-outline-primary" (click)="openEdit(user)">تعديل</button>
                <button type="button" class="btn btn-sm btn-outline-danger" (click)="deleteTarget = user">حذف</button>
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
            <h2 class="modal-title h5">{{ editingId ? 'تعديل المستخدم' : 'إنشاء مستخدم' }}</h2>
            <button type="button" class="btn-close" aria-label="إغلاق" (click)="closeFormModal()"></button>
          </div>
          <form [formGroup]="userForm" (ngSubmit)="saveUser()" novalidate>
            <div class="modal-body">
              <div class="row g-3">
                <div class="col-12 col-md-6">
                  <label for="admin-user-name" class="form-label">الاسم الكامل</label>
                  <input id="admin-user-name" class="form-control" maxlength="150" formControlName="fullName"
                         [class.is-invalid]="isInvalid('fullName')">
                  <div class="invalid-feedback">الاسم مطلوب وبحد أقصى 150 حرفًا.</div>
                </div>
                <div class="col-12 col-md-6">
                  <label for="admin-user-email" class="form-label">البريد الإلكتروني</label>
                  <input id="admin-user-email" type="email" class="form-control" maxlength="256" formControlName="email"
                         [class.is-invalid]="isInvalid('email')">
                  <div class="invalid-feedback">أدخل بريدًا إلكترونيًا صحيحًا.</div>
                </div>
                <div class="col-12">
                  <label for="admin-user-role" class="form-label">الدور</label>
                  <select id="admin-user-role" class="form-select" formControlName="role">
                    <option *ngFor="let role of roles" [ngValue]="role">{{ role | userRoleLabel }}</option>
                  </select>
                </div>
                <ng-container *ngIf="!editingId">
                  <div class="col-12 col-md-6">
                    <label for="admin-user-password" class="form-label">كلمة المرور</label>
                    <div class="input-group password-input-group">
                      <input id="admin-user-password" [type]="showPassword ? 'text' : 'password'" class="form-control"
                             formControlName="password" autocomplete="new-password"
                             [class.is-invalid]="isInvalid('password')">
                      <button type="button" class="btn password-toggle-button" (click)="showPassword = !showPassword"
                              [attr.aria-label]="showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'"
                              aria-controls="admin-user-password">{{ showPassword ? 'إخفاء' : 'إظهار' }}</button>
                    </div>
                    <div class="invalid-feedback" [class.d-block]="isInvalid('password')">8 أحرف على الأقل وتحتوي حرفًا ورقمًا.</div>
                  </div>
                  <div class="col-12 col-md-6">
                    <label for="admin-user-confirm-password" class="form-label">تأكيد كلمة المرور</label>
                    <div class="input-group password-input-group">
                      <input id="admin-user-confirm-password" [type]="showConfirmPassword ? 'text' : 'password'"
                             class="form-control" formControlName="confirmPassword" autocomplete="new-password"
                             [class.is-invalid]="isInvalid('confirmPassword') || passwordMismatch">
                      <button type="button" class="btn password-toggle-button"
                              (click)="showConfirmPassword = !showConfirmPassword"
                              [attr.aria-label]="showConfirmPassword ? 'إخفاء تأكيد كلمة المرور' : 'إظهار تأكيد كلمة المرور'"
                              aria-controls="admin-user-confirm-password">{{ showConfirmPassword ? 'إخفاء' : 'إظهار' }}</button>
                    </div>
                    <div class="invalid-feedback" [class.d-block]="isInvalid('confirmPassword') || passwordMismatch">كلمتا المرور غير متطابقتين.</div>
                  </div>
                </ng-container>
              </div>
              <div class="alert alert-info mt-3 mb-0" *ngIf="!editingId">
                الحساب الذي ينشئه المسؤول يصبح مفعّلًا مباشرة.
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
          <div class="modal-header"><h2 class="modal-title h5">تأكيد حذف المستخدم</h2></div>
          <div class="modal-body">هل تريد حذف حساب «{{ deleteTarget.fullName }}»؟</div>
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
  `
})
export class AdminUsersComponent implements OnInit {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly passwordValidators = [
    Validators.required,
    Validators.minLength(8),
    Validators.maxLength(128),
    passwordPolicyValidator
  ];

  readonly roles = [UserRole.Admin, UserRole.Employee];
  readonly statuses = [UserStatus.Pending, UserStatus.Active, UserStatus.Rejected];
  readonly filters = this.formBuilder.group({ search: '', role: 0, status: 0 });
  readonly userForm = this.formBuilder.group({
    fullName: ['', [Validators.required, Validators.maxLength(150)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(256)]],
    role: UserRole.Employee,
    password: ['', this.passwordValidators],
    confirmPassword: ['', [Validators.required, Validators.maxLength(128)]]
  }, { validators: matchingPasswordsValidator });

  users: AdminUser[] = [];
  editingId: string | null = null;
  deleteTarget: AdminUser | null = null;
  showFormModal = false;
  showPassword = false;
  showConfirmPassword = false;
  isLoading = true;
  isSaving = false;
  isDeleting = false;
  successMessage = '';
  errorMessage = '';

  constructor(private readonly usersService: AdminUsersService) { }

  ngOnInit(): void {
    this.filters.valueChanges.pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadUsers());
    this.loadUsers();
  }

  loadUsers(): void {
    const value = this.filters.getRawValue();
    this.isLoading = true;
    this.errorMessage = '';
    this.usersService.getUsers(
      value.search,
      value.role === 0 ? undefined : value.role,
      value.status === 0 ? undefined : value.status
    ).pipe(finalize(() => {
      this.isLoading = false;
      this.changeDetectorRef.markForCheck();
    })).subscribe({
      next: users => this.users = users,
      error: () => this.errorMessage = 'تعذر تحميل المستخدمين.'
    });
  }

  openCreate(): void {
    this.editingId = null;
    this.showPassword = false;
    this.showConfirmPassword = false;
    this.setPasswordValidators(true);
    this.userForm.reset({ fullName: '', email: '', role: UserRole.Employee, password: '', confirmPassword: '' });
    this.showFormModal = true;
  }

  openEdit(user: AdminUser): void {
    this.editingId = user.id;
    this.showPassword = false;
    this.showConfirmPassword = false;
    this.setPasswordValidators(false);
    this.userForm.reset({
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      password: '',
      confirmPassword: ''
    });
    this.showFormModal = true;
  }

  closeFormModal(): void {
    if (!this.isSaving) {
      this.showFormModal = false;
      this.showPassword = false;
      this.showConfirmPassword = false;
    }
  }

  get passwordMismatch(): boolean {
    return this.userForm.hasError('passwordMismatch') && this.userForm.controls.confirmPassword.touched;
  }

  isInvalid(controlName: keyof typeof this.userForm.controls): boolean {
    const control = this.userForm.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  saveUser(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const value = this.userForm.getRawValue();
    const request = this.editingId
      ? this.usersService.updateUser(this.editingId, {
          fullName: value.fullName,
          email: value.email,
          role: value.role
        })
      : this.usersService.createUser(value);

    this.isSaving = true;
    request.pipe(finalize(() => {
      this.isSaving = false;
      this.changeDetectorRef.markForCheck();
    })).subscribe({
      next: () => {
        this.successMessage = this.editingId ? 'تم تحديث المستخدم بنجاح.' : 'تم إنشاء المستخدم وتفعيله بنجاح.';
        this.showFormModal = false;
        this.loadUsers();
      },
      error: error => this.errorMessage = this.getErrorMessage(error)
    });
  }

  confirmDelete(): void {
    if (!this.deleteTarget) {
      return;
    }

    this.isDeleting = true;
    this.usersService.deleteUser(this.deleteTarget.id).pipe(
      finalize(() => {
        this.isDeleting = false;
        this.changeDetectorRef.markForCheck();
      })
    ).subscribe({
      next: () => {
        this.deleteTarget = null;
        this.successMessage = 'تم حذف المستخدم بنجاح.';
        this.loadUsers();
      },
      error: error => this.errorMessage = this.getErrorMessage(error)
    });
  }

  trackById(_index: number, user: AdminUser): string {
    return user.id;
  }

  private setPasswordValidators(required: boolean): void {
    const password = this.userForm.controls.password;
    const confirmation = this.userForm.controls.confirmPassword;
    if (required) {
      password.setValidators(this.passwordValidators);
      confirmation.setValidators([Validators.required, Validators.maxLength(128)]);
    } else {
      password.clearValidators();
      confirmation.clearValidators();
    }
    password.updateValueAndValidity();
    confirmation.updateValueAndValidity();
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    const response = error.error as ApiErrorResponse | null;
    const messages: Record<string, string> = {
      EMAIL_ALREADY_EXISTS: 'البريد الإلكتروني مستخدم مسبقًا.',
      CANNOT_DELETE_CURRENT_USER: 'لا يمكنك حذف حسابك الحالي.',
      LAST_ACTIVE_ADMIN_REQUIRED: 'لا يمكن حذف أو تخفيض دور آخر مسؤول مفعّل.',
      USER_HAS_CREATED_TASKS: 'لا يمكن حذف المستخدم لأنه منشئ لمهام محفوظة.',
      USER_NOT_FOUND: 'المستخدم غير موجود.'
    };
    return response?.code && messages[response.code] ? messages[response.code] : 'تعذر تنفيذ العملية.';
  }
}
