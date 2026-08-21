import { Component } from '@angular/core';
import { UserRole } from '../../../core/models/auth.models';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-not-found',
  standalone: false,
  template: `
    <main class="container py-5">
      <div class="row justify-content-center">
        <div class="col-12 col-md-8 col-lg-6">
          <section class="card content-card text-center p-4 p-md-5">
            <div class="display-3 fw-bold text-primary mb-2">404</div>
            <h1 class="h3 fw-bold">الصفحة غير موجودة</h1>
            <p class="text-secondary mb-4">قد يكون الرابط غير صحيح أو تم نقل الصفحة.</p>
            <a class="btn btn-primary align-self-center" [routerLink]="homeLink">{{ homeLabel }}</a>
          </section>
        </div>
      </div>
    </main>
  `
})
export class NotFoundComponent {
  constructor(private readonly authService: AuthService) { }

  get homeLink(): string {
    const user = this.authService.currentUser;
    if (!user) {
      return '/login';
    }

    return user.role === UserRole.Admin ? '/admin/dashboard' : '/employee/tasks';
  }

  get homeLabel(): string {
    return this.authService.currentUser ? 'العودة إلى الصفحة الرئيسية' : 'الذهاب إلى تسجيل الدخول';
  }
}
