import { ChangeDetectorRef, Component, DestroyRef, HostListener, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { NotificationItem } from '../../../core/models/notification.models';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notification-menu',
  standalone: false,
  template: `
    <div class="notification-menu" (click)="$event.stopPropagation()">
      <button type="button" class="notification-toggle" aria-label="الإشعارات"
              [attr.aria-expanded]="isOpen" (click)="toggleMenu()">
        <i class="bi bi-bell" aria-hidden="true"></i>
        <span class="notification-badge" *ngIf="unreadCount > 0">
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </span>
      </button>

      <section class="notification-dropdown" *ngIf="isOpen" aria-label="قائمة الإشعارات">
        <header class="notification-header">
          <div>
            <h2 class="h6 fw-bold mb-1">الإشعارات</h2>
            <small class="text-secondary" *ngIf="unreadCount > 0">{{ unreadCount }} غير مقروءة</small>
            <small class="text-secondary" *ngIf="unreadCount === 0">لا توجد إشعارات جديدة</small>
          </div>
          <button type="button" class="btn btn-sm btn-outline-secondary" (click)="loadNotifications()"
                  [disabled]="isLoading">
            تحديث
          </button>
        </header>

        <div class="notification-state text-secondary" role="status" *ngIf="isLoading && notifications.length === 0">
          <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
          <span>جارٍ تحميل الإشعارات...</span>
        </div>

        <div class="alert alert-danger notification-error" role="alert" *ngIf="errorMessage">
          {{ errorMessage }}
        </div>

        <div class="notification-state text-secondary"
             *ngIf="!isLoading && !errorMessage && notifications.length === 0">
          لا توجد إشعارات حاليًا.
        </div>

        <div class="notification-list" *ngIf="notifications.length > 0">
          <button type="button" class="notification-item"
                  *ngFor="let notification of visibleNotifications; trackBy: trackById"
                  [class.notification-unread]="!notification.isRead"
                  [disabled]="markingReadIds.has(notification.id)"
                  (click)="markAsRead(notification)">
            <span class="notification-status" aria-hidden="true"></span>
            <span class="notification-copy">
              <span class="notification-message">{{ notification.message }}</span>
              <span class="notification-meta">
                {{ notification.createdAtUtc | date:'short' }}
                <span aria-hidden="true">•</span>
                {{ notification.isRead ? 'مقروء' : 'غير مقروء' }}
              </span>
            </span>
            <span class="spinner-border spinner-border-sm" aria-hidden="true"
                  *ngIf="markingReadIds.has(notification.id)"></span>
          </button>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .notification-menu { position: relative; }

    .notification-toggle {
      position: relative;
      display: grid;
      width: 42px;
      height: 42px;
      padding: 0;
      color: var(--app-text);
      border: 1px solid var(--app-border);
      border-radius: 14px;
      background: var(--app-surface-soft);
      place-items: center;
      transition: color 180ms ease, border-color 180ms ease, transform 180ms ease;
    }

    .notification-toggle:hover,
    .notification-toggle:focus-visible {
      color: var(--app-primary);
      border-color: rgb(var(--bs-primary-rgb) / 35%);
      transform: translateY(-1px);
    }

    .notification-toggle .bi { font-size: 1.3rem; line-height: 1; }

    .notification-badge {
      position: absolute;
      top: -6px;
      inset-inline-start: -7px;
      display: grid;
      min-width: 20px;
      height: 20px;
      padding-inline: 5px;
      color: white;
      border: 2px solid var(--app-surface-solid);
      border-radius: 999px;
      background: var(--app-danger);
      font-size: 0.65rem;
      font-weight: 800;
      line-height: 1;
      place-items: center;
    }

    .notification-dropdown {
      position: absolute;
      z-index: 1080;
      top: calc(100% + 0.75rem);
      inset-inline-end: 0;
      width: min(390px, calc(100vw - 1.5rem));
      overflow: hidden;
      border: 1px solid var(--app-border);
      border-radius: 20px;
      background: var(--app-surface-solid);
      box-shadow: 0 24px 65px rgb(15 23 42 / 24%);
    }

    .notification-header {
      display: flex;
      padding: 1rem;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      border-bottom: 1px solid var(--app-border);
      background: linear-gradient(135deg, rgb(var(--bs-primary-rgb) / 10%), transparent);
    }

    .notification-list {
      max-height: min(430px, 62vh);
      overflow-y: auto;
      overscroll-behavior: contain;
    }

    .notification-item {
      display: flex;
      width: 100%;
      padding: 0.95rem 1rem;
      align-items: flex-start;
      gap: 0.75rem;
      color: var(--app-text);
      border: 0;
      border-bottom: 1px solid var(--app-border);
      background: transparent;
      text-align: start;
      transition: background-color 160ms ease;
    }

    .notification-item:last-child { border-bottom: 0; }
    .notification-item:hover { background: var(--app-surface-soft); }
    .notification-item:disabled { opacity: 0.7; }
    .notification-unread { background: rgb(var(--bs-primary-rgb) / 8%); }

    .notification-status {
      flex: 0 0 9px;
      width: 9px;
      height: 9px;
      margin-top: 0.42rem;
      border: 2px solid var(--app-border);
      border-radius: 50%;
      background: transparent;
    }

    .notification-unread .notification-status {
      border-color: var(--app-primary);
      background: var(--app-primary);
      box-shadow: 0 0 0 4px rgb(var(--bs-primary-rgb) / 12%);
    }

    .notification-copy { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 0.4rem; }
    .notification-message { font-size: 0.9rem; line-height: 1.65; }
    .notification-unread .notification-message { font-weight: 750; }
    .notification-meta { display: flex; align-items: center; gap: 0.4rem; color: var(--app-muted); font-size: 0.74rem; }
    .notification-state { display: flex; min-height: 120px; padding: 1rem; align-items: center; justify-content: center; gap: 0.6rem; text-align: center; }
    .notification-error { margin: 0.75rem; font-size: 0.82rem; }

    @media (max-width: 575.98px) {
      .notification-toggle { width: 38px; height: 38px; border-radius: 12px; }
      .notification-dropdown { position: fixed; top: 74px; right: 0.75rem; left: 0.75rem; width: auto; }
    }
  `]
})
export class NotificationMenuComponent implements OnInit {
  notifications: NotificationItem[] = [];
  readonly markingReadIds = new Set<string>();
  isOpen = false;
  isLoading = false;
  errorMessage = '';

  constructor(
    private readonly notificationService: NotificationService,
    private readonly destroyRef: DestroyRef,
    private readonly changeDetectorRef: ChangeDetectorRef
  ) { }

  get unreadCount(): number {
    return this.notifications.filter(notification => !notification.isRead).length;
  }

  get visibleNotifications(): NotificationItem[] {
    return this.notifications.slice(0, 10);
  }

  ngOnInit(): void {
    this.loadNotifications();
  }

  @HostListener('document:click')
  closeMenu(): void {
    this.isOpen = false;
  }

  toggleMenu(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen && !this.isLoading) {
      this.loadNotifications();
    }
  }

  loadNotifications(): void {
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.notificationService.getNotifications().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        this.isLoading = false;
        this.changeDetectorRef.markForCheck();
      })
    ).subscribe({
      next: notifications => this.notifications = notifications,
      error: () => this.errorMessage = 'تعذر تحميل الإشعارات. يمكنك متابعة استخدام النظام.'
    });
  }

  markAsRead(notification: NotificationItem): void {
    if (notification.isRead || this.markingReadIds.has(notification.id)) {
      return;
    }

    this.markingReadIds.add(notification.id);
    this.errorMessage = '';
    this.notificationService.markAsRead(notification.id).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        this.markingReadIds.delete(notification.id);
        this.changeDetectorRef.markForCheck();
      })
    ).subscribe({
      next: () => {
        this.notifications = this.notifications.map(item =>
          item.id === notification.id ? { ...item, isRead: true } : item);
      },
      error: () => this.errorMessage = 'تعذر تعليم الإشعار كمقروء.'
    });
  }

  trackById(_index: number, notification: NotificationItem): string {
    return notification.id;
  }
}
