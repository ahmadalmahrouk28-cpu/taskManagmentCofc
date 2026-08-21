import { CommonModule } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { NotificationItem } from '../../../core/models/notification.models';
import { NotificationService } from '../../../core/services/notification.service';
import { NotificationMenuComponent } from './notification-menu.component';

describe('NotificationMenuComponent', () => {
  const unreadNotification: NotificationItem = {
    id: 'unread-id',
    message: 'تمت الموافقة على طلب تسجيلك، ويمكنك الآن تسجيل الدخول.',
    isRead: false,
    createdAtUtc: '2026-08-21T00:00:00Z'
  };

  it('shows the unread badge and updates it locally after marking the notification as read', () => {
    const service = jasmine.createSpyObj<NotificationService>('NotificationService', [
      'getNotifications',
      'markAsRead'
    ]);
    service.getNotifications.and.returnValue(of([
      unreadNotification,
      { ...unreadNotification, id: 'read-id', isRead: true }
    ]));
    service.markAsRead.and.returnValue(of(undefined));
    TestBed.configureTestingModule({
      declarations: [NotificationMenuComponent],
      imports: [CommonModule],
      providers: [{ provide: NotificationService, useValue: service }]
    });
    const fixture = TestBed.createComponent(NotificationMenuComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.notification-badge')?.textContent.trim()).toBe('1');

    (fixture.nativeElement.querySelector('.notification-toggle') as HTMLButtonElement).click();
    fixture.detectChanges();
    const unreadItem = fixture.nativeElement.querySelector('.notification-unread') as HTMLButtonElement;
    unreadItem.click();
    fixture.detectChanges();

    expect(service.markAsRead).toHaveBeenCalledOnceWith(unreadNotification.id);
    expect(fixture.componentInstance.unreadCount).toBe(0);
    expect(fixture.nativeElement.querySelector('.notification-badge')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('مقروء');
  });

  it('shows the empty state when the user has no notifications', () => {
    const service = jasmine.createSpyObj<NotificationService>('NotificationService', [
      'getNotifications',
      'markAsRead'
    ]);
    service.getNotifications.and.returnValue(of([]));
    TestBed.configureTestingModule({
      declarations: [NotificationMenuComponent],
      imports: [CommonModule],
      providers: [{ provide: NotificationService, useValue: service }]
    });
    const fixture = TestBed.createComponent(NotificationMenuComponent);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.notification-toggle') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('لا توجد إشعارات حاليًا.');
  });

  it('keeps the menu usable when loading notifications fails', () => {
    const service = jasmine.createSpyObj<NotificationService>('NotificationService', [
      'getNotifications',
      'markAsRead'
    ]);
    service.getNotifications.and.returnValue(throwError(() => new Error('Network failure')));
    TestBed.configureTestingModule({
      declarations: [NotificationMenuComponent],
      imports: [CommonModule],
      providers: [{ provide: NotificationService, useValue: service }]
    });
    const fixture = TestBed.createComponent(NotificationMenuComponent);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.notification-toggle') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('تعذر تحميل الإشعارات');
    expect(fixture.nativeElement.querySelector('.notification-toggle')).toBeTruthy();
  });
});
