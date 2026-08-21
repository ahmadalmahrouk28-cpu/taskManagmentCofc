import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { ApiErrorResponse } from '../../../core/models/api.models';
import { AuthService } from '../../../core/services/auth.service';
import { matchingPasswordsValidator, passwordPolicyValidator } from '../../../shared/validators/password.validators';

@Component({
  selector: 'app-register',
  standalone: false,
  template: `
    <main class="auth-shell">
      <div class="row g-0 auth-layout">
        <div class="col-12 col-lg-5 order-1 order-lg-2 p-2">
          <section class="auth-visual">
            <div class="auth-brand">
              <span class="brand-mark"><i class="bi bi-check2-square"></i></span>
              <span>إدارة المهام</span>
            </div>
            <div class="auth-visual-copy">
              <h2 class="mb-3">ابدأ رحلتك<br>مع الفريق.</h2>
              <p class="mb-0">أنشئ حسابك، وبعد موافقة المسؤول ستصبح جاهزًا لاستلام مهامك ومتابعة تقدمك.</p>
              <ul class="auth-feature-list">
                <li>تسجيل آمن</li><li>تنبيهات فورية</li><li>واجهة واضحة</li>
              </ul>
            </div>
          </section>
        </div>
        <div class="col-12 col-lg-7 order-2 order-lg-1 auth-form-column">
          <section class="auth-card">
              <span class="auth-eyebrow">انضم إلى مساحة العمل</span>
              <h1 class="h2 fw-bold mb-2">إنشاء حساب موظف</h1>
              <p class="text-secondary mb-4">سيصبح الحساب متاحًا بعد مراجعة المسؤول وموافقته.</p>

              <div class="alert alert-success" role="status" *ngIf="successMessage">{{ successMessage }}</div>
              <div class="alert alert-danger" role="alert" *ngIf="errorMessage">{{ errorMessage }}</div>

              <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
                <div class="mb-3">
                  <label for="full-name" class="form-label">الاسم الكامل</label>
                  <input id="full-name" class="form-control" formControlName="fullName" maxlength="150"
                         autocomplete="name" [class.is-invalid]="isInvalid('fullName')">
                  <div class="invalid-feedback">الاسم الكامل مطلوب وبحد أقصى 150 حرفًا.</div>
                </div>

                <div class="mb-3">
                  <label for="register-email" class="form-label">البريد الإلكتروني</label>
                  <input id="register-email" type="email" class="form-control" formControlName="email" maxlength="256"
                         autocomplete="email" [class.is-invalid]="isInvalid('email')">
                  <div class="invalid-feedback">أدخل بريدًا إلكترونيًا صحيحًا.</div>
                </div>

                <div class="mb-3">
                  <label for="register-password" class="form-label">كلمة المرور</label>
                  <div class="input-group password-input-group">
                    <input id="register-password" [type]="showPassword ? 'text' : 'password'" class="form-control"
                           formControlName="password" autocomplete="new-password"
                           [class.is-invalid]="isInvalid('password')">
                    <button type="button" class="btn password-toggle-button" (click)="showPassword = !showPassword"
                            [attr.aria-label]="showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'"
                            aria-controls="register-password">{{ showPassword ? 'إخفاء' : 'إظهار' }}</button>
                  </div>
                  <div class="invalid-feedback" [class.d-block]="isInvalid('password')">8 أحرف على الأقل، وتحتوي حرفًا ورقمًا.</div>
                </div>

                <div class="mb-4">
                  <label for="confirm-password" class="form-label">تأكيد كلمة المرور</label>
                  <div class="input-group password-input-group">
                    <input id="confirm-password" [type]="showConfirmPassword ? 'text' : 'password'" class="form-control"
                           formControlName="confirmPassword" autocomplete="new-password"
                           [class.is-invalid]="isInvalid('confirmPassword') || passwordMismatch">
                    <button type="button" class="btn password-toggle-button"
                            (click)="showConfirmPassword = !showConfirmPassword"
                            [attr.aria-label]="showConfirmPassword ? 'إخفاء تأكيد كلمة المرور' : 'إظهار تأكيد كلمة المرور'"
                            aria-controls="confirm-password">{{ showConfirmPassword ? 'إخفاء' : 'إظهار' }}</button>
                  </div>
                  <div class="invalid-feedback" [class.d-block]="isInvalid('confirmPassword') || passwordMismatch">كلمتا المرور غير متطابقتين.</div>
                </div>

                <button class="btn btn-primary btn-lg w-100" type="submit" [disabled]="isSubmitting || !!successMessage">
                  <span class="spinner-border spinner-border-sm ms-2" *ngIf="isSubmitting" aria-hidden="true"></span>
                  {{ isSubmitting ? 'جارٍ إرسال الطلب...' : 'إرسال طلب التسجيل' }}
                </button>
              </form>

              <p class="text-center text-secondary mt-4 mb-0">
                لديك حساب؟ <a class="fw-bold" routerLink="/login">تسجيل الدخول</a>
              </p>
          </section>
        </div>
      </div>
    </main>
  `
})
export class RegisterComponent {
  private readonly formBuilder = inject(NonNullableFormBuilder);

  readonly form = this.formBuilder.group({
    fullName: ['', [Validators.required, Validators.maxLength(150)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(256)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128), passwordPolicyValidator]],
    confirmPassword: ['', [Validators.required, Validators.maxLength(128)]]
  }, { validators: matchingPasswordsValidator });

  isSubmitting = false;
  showPassword = false;
  showConfirmPassword = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private readonly authService: AuthService,
    private readonly changeDetectorRef: ChangeDetectorRef
  ) { }

  get passwordMismatch(): boolean {
    return this.form.hasError('passwordMismatch') && this.form.controls.confirmPassword.touched;
  }

  isInvalid(controlName: 'fullName' | 'email' | 'password' | 'confirmPassword'): boolean {
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

    this.authService.register(this.form.getRawValue()).pipe(
      finalize(() => {
        this.isSubmitting = false;
        this.changeDetectorRef.markForCheck();
      })
    ).subscribe({
      next: () => {
        this.successMessage = 'تم إنشاء الحساب بنجاح، وهو الآن بانتظار موافقة المسؤول.';
        this.form.reset({ fullName: '', email: '', password: '', confirmPassword: '' });
        this.showPassword = false;
        this.showConfirmPassword = false;
      },
      error: (error: HttpErrorResponse) => {
        const response = error.error as ApiErrorResponse | null;
        if (error.status === 0) {
          this.errorMessage = 'تعذر الاتصال بالخادم. تحقق من الاتصال ثم حاول مرة أخرى.';
        } else {
          this.errorMessage = response?.code === 'EMAIL_ALREADY_EXISTS'
            ? 'البريد الإلكتروني مستخدم مسبقًا.'
            : 'تعذر إرسال طلب التسجيل. تحقق من البيانات وحاول مرة أخرى.';
        }
      }
    });
  }
}
