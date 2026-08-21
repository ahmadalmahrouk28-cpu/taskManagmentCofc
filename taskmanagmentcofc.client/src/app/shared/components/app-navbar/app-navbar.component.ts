import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UserRole } from '../../../core/models/auth.models';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: false,
  template: `
    <nav class="navbar app-navbar">
      <div class="container-fluid px-3 px-lg-4">
        <button type="button" class="btn sidebar-toggle d-lg-none" (click)="sidebarToggle.emit()"
                [attr.aria-expanded]="sidebarOpen" aria-controls="mobile-sidebar"
                [attr.aria-label]="sidebarOpen ? 'إغلاق القائمة' : 'فتح القائمة'">
          <i class="bi" [class.bi-list]="!sidebarOpen" [class.bi-x-lg]="sidebarOpen" aria-hidden="true"></i>
        </button>
        <a class="navbar-brand fw-bold" [routerLink]="homeLink">
          <span class="brand-mark" aria-hidden="true">
            <i class="bi bi-check2-square"></i>
          </span>
          <span class="brand-name">إدارة المهام</span>
        </a>

        <div class="d-flex align-items-center gap-2 gap-md-3" *ngIf="authService.currentUser$ | async as user">
          <app-notification-menu></app-notification-menu>
          <div class="user-summary text-end lh-sm">
            <span class="user-avatar" aria-hidden="true">{{ user.fullName.charAt(0) }}</span>
            <span class="min-w-0">
              <span class="d-block fw-bold text-truncate">{{ user.fullName }}</span>
              <small class="text-secondary">{{ user.role | userRoleLabel }}</small>
            </span>
          </div>
        </div>
      </div>
    </nav>
  `
})
export class AppNavbarComponent {
  @Input() sidebarOpen = false;
  @Output() readonly sidebarToggle = new EventEmitter<void>();

  constructor(
    readonly authService: AuthService
  ) { }

  get homeLink(): string {
    return this.authService.currentUser?.role === UserRole.Admin
      ? '/admin/dashboard'
      : '/employee/tasks';
  }
}
