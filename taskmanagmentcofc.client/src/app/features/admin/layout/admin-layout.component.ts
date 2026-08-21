import { Component } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: false,
  template: `
    <app-navbar [sidebarOpen]="isSidebarOpen" (sidebarToggle)="toggleSidebar()"></app-navbar>
    <div class="container-fluid">
      <div class="row page-shell g-0">
        <aside id="mobile-sidebar" class="col-12 col-lg-3 col-xl-2 app-sidebar" [class.is-open]="isSidebarOpen">
          <div class="sidebar-caption">مساحة المسؤول</div>
          <nav class="nav nav-pills app-navigation gap-2" aria-label="قائمة المسؤول">
            <a class="nav-link" routerLink="dashboard" routerLinkActive="active" (click)="closeSidebar()">
              <span class="nav-icon"><i class="bi bi-grid"></i></span>
              <span>لوحة التحكم</span>
            </a>
            <a class="nav-link" routerLink="tasks" routerLinkActive="active" (click)="closeSidebar()">
              <span class="nav-icon"><i class="bi bi-list-check"></i></span>
              <span>المهام</span>
            </a>
            <a class="nav-link" routerLink="task-statistics" routerLinkActive="active" (click)="closeSidebar()">
              <span class="nav-icon"><i class="bi bi-bar-chart-line"></i></span>
              <span>إحصائية المهام</span>
            </a>
            <a class="nav-link" routerLink="users" routerLinkActive="active" (click)="closeSidebar()">
              <span class="nav-icon"><i class="bi bi-people"></i></span>
              <span>المستخدمون</span>
            </a>
            <a class="nav-link" routerLink="registrations" routerLinkActive="active" (click)="closeSidebar()">
              <span class="nav-icon"><i class="bi bi-person-plus"></i></span>
              <span>طلبات التسجيل</span>
            </a>
            <button type="button" class="nav-link logout-link border-0" (click)="logout()">
              <span class="nav-icon"><i class="bi bi-box-arrow-right"></i></span>
              <span>تسجيل الخروج</span>
            </button>
          </nav>
        </aside>
        <button type="button" class="sidebar-backdrop" *ngIf="isSidebarOpen"
                aria-label="إغلاق القائمة" (click)="closeSidebar()"></button>
        <main class="col-12 col-lg-9 col-xl-10 app-main">
          <div class="content-container"><router-outlet></router-outlet></div>
        </main>
      </div>
    </div>
  `
})
export class AdminLayoutComponent {
  isSidebarOpen = false;

  constructor(private readonly authService: AuthService) { }

  logout(): void {
    this.authService.logout();
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
  }
}
