import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { User } from '../../../core/models/auth.models';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-employee-profile',
  standalone: false,
  template: `
    <header class="mb-4">
      <h1 class="h3 fw-bold mb-1">الملف الشخصي</h1>
      <p class="text-secondary mb-0">بيانات حسابك الحالية.</p>
    </header>

    <div class="alert alert-danger" role="alert" *ngIf="errorMessage">{{ errorMessage }}</div>
    <div class="d-flex align-items-center gap-2 text-secondary" role="status" *ngIf="isLoading">
      <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
      <span>جارٍ تحميل بيانات الحساب...</span>
    </div>
    <div class="alert alert-light border" *ngIf="!isLoading && !errorMessage && !user">
      لا تتوفر بيانات الحساب حاليًا.
    </div>

    <section class="card content-card" *ngIf="user && !isLoading">
      <div class="card-body p-4">
        <dl class="row mb-0">
          <dt class="col-sm-3">الاسم الكامل</dt>
          <dd class="col-sm-9">{{ user.fullName }}</dd>
          <dt class="col-sm-3">البريد الإلكتروني</dt>
          <dd class="col-sm-9">{{ user.email }}</dd>
          <dt class="col-sm-3">الدور</dt>
          <dd class="col-sm-9"><span class="badge text-bg-light border">{{ user.role | userRoleLabel }}</span></dd>
          <dt class="col-sm-3">الحالة</dt>
          <dd class="col-sm-9"><span class="badge text-bg-light border">{{ user.status | userStatusLabel }}</span></dd>
        </dl>
      </div>
    </section>
  `
})
export class EmployeeProfileComponent implements OnInit {
  user: User | null = null;
  isLoading = true;
  errorMessage = '';

  constructor(
    private readonly authService: AuthService,
    private readonly changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.authService.getCurrentUser().pipe(
      finalize(() => {
        this.isLoading = false;
        this.changeDetectorRef.markForCheck();
      })
    ).subscribe({
      next: user => this.user = user,
      error: () => this.errorMessage = 'تعذر تحميل بيانات الحساب.'
    });
  }
}
