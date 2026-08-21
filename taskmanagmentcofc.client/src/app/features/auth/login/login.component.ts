import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { ApiErrorResponse } from '../../../core/models/api.models';
import { UserRole } from '../../../core/models/auth.models';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: false,
  template: `
    <main class="auth-shell">
      <div class="row g-0 auth-layout">
        <div class="col-12 col-lg-6 order-2 order-lg-1 auth-form-column">
          <section class="auth-card">
            <span class="auth-eyebrow">مرحبًا بعودتك</span>
            <h1 class="display-6 fw-bold mb-2">تسجيل الدخول</h1>
            <p class="text-secondary mb-4">أدخل بياناتك للوصول إلى مساحة العمل ومتابعة مهامك.</p>

            <div class="alert alert-danger" role="alert" *ngIf="errorMessage">{{ errorMessage }}</div>

            <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
              <div class="mb-3">
                <label for="login-email" class="form-label">البريد الإلكتروني</label>
                <input id="login-email" type="email" class="form-control" formControlName="email"
                       placeholder="name@example.com" autocomplete="email" [class.is-invalid]="isInvalid('email')">
                <div class="invalid-feedback">أدخل بريدًا إلكترونيًا صحيحًا.</div>
              </div>

              <div class="mb-4">
                <label for="login-password" class="form-label">كلمة المرور</label>
                <input id="login-password" type="password" class="form-control" formControlName="password"
                       placeholder="••••••••" autocomplete="current-password" [class.is-invalid]="isInvalid('password')">
                <div class="invalid-feedback">كلمة المرور مطلوبة.</div>
              </div>

              <button class="btn btn-primary btn-lg w-100" type="submit" [disabled]="isSubmitting">
                <span class="spinner-border spinner-border-sm ms-2" *ngIf="isSubmitting" aria-hidden="true"></span>
                {{ isSubmitting ? 'جارٍ الدخول...' : 'الدخول إلى النظام' }}
              </button>
            </form>

            <p class="text-center text-secondary mt-4 mb-0">
              ليس لديك حساب؟ <a class="fw-bold" routerLink="/register">إنشاء حساب موظف</a>
            </p>
          </section>
        </div>
        <div class="col-12 col-lg-6 order-1 order-lg-2 p-2">
          <section class="auth-visual">
            <div class="auth-brand">
              <span class="brand-mark"><i class="bi bi-check2-square"></i></span>
              <span>إدارة المهام</span>
            </div>
            <div class="auth-visual-copy">
              <h2 class="mb-3">أنجز العمل<br>بوضوح وثقة.</h2>
              <p class="mb-0">مساحة موحدة لتنظيم الفريق، توزيع المسؤوليات ومتابعة الإنجاز لحظة بلحظة.</p>
              <ul class="auth-feature-list">
                <li>متابعة مباشرة</li><li>صلاحيات آمنة</li><li>تجربة سريعة</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </main>
  `
})
export class LoginComponent {
  private readonly formBuilder = inject(NonNullableFormBuilder);

  readonly form = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(256)]],
    password: ['', [Validators.required, Validators.maxLength(128)]]
  });

  isSubmitting = false;
  errorMessage = '';

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly changeDetectorRef: ChangeDetectorRef
  ) { }

  isInvalid(controlName: 'email' | 'password'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage = '';
    this.isSubmitting = true;

    this.authService.login(this.form.getRawValue()).pipe(
      finalize(() => {
        this.isSubmitting = false;
        this.changeDetectorRef.markForCheck();
      })
    ).subscribe({
      next: response => {
        const destination = response.user.role === UserRole.Admin
          ? '/admin/dashboard'
          : '/employee/tasks';
        void this.router.navigate([destination]);
      },
      error: (error: HttpErrorResponse) => this.errorMessage = this.getErrorMessage(error)
    });
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'تعذر الاتصال بالخادم. تحقق من الاتصال ثم حاول مرة أخرى.';
    }

    const response = error.error as ApiErrorResponse | null;
    switch (response?.code) {
      case 'ACCOUNT_PENDING':
        return 'حسابك ينتظر موافقة المسؤول.';
      case 'ACCOUNT_REJECTED':
        return response.reason ? `تم رفض الحساب: ${response.reason}` : 'تم رفض طلب تسجيل الحساب.';
      case 'INVALID_CREDENTIALS':
        return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
      default:
        return 'تعذر تسجيل الدخول. حاول مرة أخرى.';
    }
  }
}
