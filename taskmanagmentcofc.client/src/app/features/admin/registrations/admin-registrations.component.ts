import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { ApiErrorResponse } from '../../../core/models/api.models';
import { PendingRegistration } from '../../../core/models/user.models';
import { AdminRegistrationsService } from '../../../core/services/admin-registrations.service';

@Component({
  selector: 'app-admin-registrations',
  standalone: false,
  template: `
    <header class="mb-4">
      <h1 class="h3 fw-bold mb-1">طلبات التسجيل</h1>
      <p class="text-secondary mb-0">مراجعة طلبات الموظفين المعلقة وقبولها أو رفضها.</p>
    </header>

    <div class="alert alert-success" role="status" *ngIf="successMessage">{{ successMessage }}</div>
    <div class="alert alert-danger" role="alert" *ngIf="errorMessage">{{ errorMessage }}</div>

    <div class="d-flex align-items-center gap-2 text-secondary" role="status" *ngIf="isLoading">
      <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
      <span>جارٍ تحميل طلبات التسجيل...</span>
    </div>

    <div class="alert alert-light border" *ngIf="!isLoading && !errorMessage && registrations.length === 0">
      لا توجد طلبات تسجيل معلقة حاليًا.
    </div>

    <div class="table-responsive" *ngIf="!isLoading && registrations.length > 0">
      <table class="table table-hover align-middle">
        <thead>
          <tr><th>الاسم الكامل</th><th>البريد الإلكتروني</th><th>تاريخ الطلب</th><th>الإجراءات</th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let registration of registrations; trackBy: trackById">
            <td class="fw-semibold">{{ registration.fullName }}</td>
            <td>{{ registration.email }}</td>
            <td class="text-nowrap">{{ registration.createdAtUtc | date:'short' }}</td>
            <td>
              <div class="d-flex flex-wrap gap-2">
                <button type="button" class="btn btn-sm btn-success" (click)="approvalTarget = registration">موافقة</button>
                <button type="button" class="btn btn-sm btn-outline-danger" (click)="openReject(registration)">رفض</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="modal d-block" tabindex="-1" role="dialog" aria-modal="true" *ngIf="approvalTarget">
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header"><h2 class="modal-title h5">تأكيد الموافقة</h2></div>
          <div class="modal-body">هل تريد تفعيل حساب «{{ approvalTarget.fullName }}»؟</div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" (click)="approvalTarget = null">إلغاء</button>
            <button type="button" class="btn btn-success" [disabled]="isProcessing" (click)="approve()">
              {{ isProcessing ? 'جارٍ التنفيذ...' : 'موافقة' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade show" *ngIf="approvalTarget"></div>

    <div class="modal d-block" tabindex="-1" role="dialog" aria-modal="true" *ngIf="rejectTarget">
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title h5">رفض طلب التسجيل</h2>
            <button type="button" class="btn-close" aria-label="إغلاق" (click)="closeReject()"></button>
          </div>
          <form [formGroup]="rejectForm" (ngSubmit)="reject()" novalidate>
            <div class="modal-body">
              <p>سيتم رفض طلب «{{ rejectTarget.fullName }}».</p>
              <label for="rejection-reason" class="form-label">سبب الرفض</label>
              <textarea id="rejection-reason" class="form-control" rows="4" maxlength="1000" formControlName="reason"
                        [class.is-invalid]="reasonInvalid"></textarea>
              <div class="invalid-feedback">سبب الرفض مطلوب وبحد أقصى 1000 حرف.</div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary" (click)="closeReject()">إلغاء</button>
              <button type="submit" class="btn btn-danger" [disabled]="isProcessing">
                {{ isProcessing ? 'جارٍ التنفيذ...' : 'تأكيد الرفض' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade show" *ngIf="rejectTarget"></div>
  `
})
export class AdminRegistrationsComponent implements OnInit {
  private readonly formBuilder = inject(NonNullableFormBuilder);

  readonly rejectForm = this.formBuilder.group({
    reason: ['', [Validators.required, Validators.maxLength(1000), Validators.pattern(/.*\S.*/s)]]
  });

  registrations: PendingRegistration[] = [];
  approvalTarget: PendingRegistration | null = null;
  rejectTarget: PendingRegistration | null = null;
  isLoading = true;
  isProcessing = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private readonly registrationsService: AdminRegistrationsService,
    private readonly changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadRegistrations();
  }

  get reasonInvalid(): boolean {
    const control = this.rejectForm.controls.reason;
    return control.invalid && (control.dirty || control.touched);
  }

  loadRegistrations(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.registrationsService.getPending().pipe(
      finalize(() => {
        this.isLoading = false;
        this.changeDetectorRef.markForCheck();
      })
    ).subscribe({
      next: registrations => this.registrations = registrations,
      error: () => this.errorMessage = 'تعذر تحميل طلبات التسجيل.'
    });
  }

  approve(): void {
    if (!this.approvalTarget) {
      return;
    }

    this.isProcessing = true;
    this.registrationsService.approve(this.approvalTarget.id).pipe(
      finalize(() => {
        this.isProcessing = false;
        this.changeDetectorRef.markForCheck();
      })
    ).subscribe({
      next: () => {
        this.approvalTarget = null;
        this.successMessage = 'تمت الموافقة على طلب التسجيل وتفعيل الحساب.';
        this.loadRegistrations();
      },
      error: error => this.errorMessage = this.getErrorMessage(error)
    });
  }

  openReject(registration: PendingRegistration): void {
    this.rejectTarget = registration;
    this.rejectForm.reset({ reason: '' });
  }

  closeReject(): void {
    if (!this.isProcessing) {
      this.rejectTarget = null;
    }
  }

  reject(): void {
    if (!this.rejectTarget || this.rejectForm.invalid) {
      this.rejectForm.markAllAsTouched();
      return;
    }

    this.isProcessing = true;
    this.registrationsService.reject(this.rejectTarget.id, this.rejectForm.getRawValue().reason.trim()).pipe(
      finalize(() => {
        this.isProcessing = false;
        this.changeDetectorRef.markForCheck();
      })
    ).subscribe({
      next: () => {
        this.rejectTarget = null;
        this.successMessage = 'تم رفض طلب التسجيل وحفظ السبب.';
        this.loadRegistrations();
      },
      error: error => this.errorMessage = this.getErrorMessage(error)
    });
  }

  trackById(_index: number, registration: PendingRegistration): string {
    return registration.id;
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    const response = error.error as ApiErrorResponse | null;
    const messages: Record<string, string> = {
      USER_NOT_FOUND: 'المستخدم غير موجود.',
      INVALID_REGISTRATION_ROLE: 'يمكن معالجة طلبات الموظفين فقط.',
      REGISTRATION_NOT_PENDING: 'تمت معالجة هذا الطلب مسبقًا.'
    };
    return response?.code && messages[response.code] ? messages[response.code] : 'تعذر تنفيذ العملية.';
  }
}
