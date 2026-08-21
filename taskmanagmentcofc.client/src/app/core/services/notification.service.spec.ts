import { HttpClient } from '@angular/common/http';
import { firstValueFrom, of } from 'rxjs';
import { NotificationItem } from '../models/notification.models';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  it('loads notifications without sending a user id', async () => {
    const notifications: NotificationItem[] = [];
    const http = jasmine.createSpyObj<HttpClient>('HttpClient', ['get', 'patch']);
    http.get.and.returnValue(of(notifications));
    const service = new NotificationService(http);

    const result = await firstValueFrom(service.getNotifications());

    expect(result).toBe(notifications);
    expect(http.get).toHaveBeenCalledOnceWith('/api/notifications');
  });

  it('marks a notification as read through its protected endpoint', async () => {
    const http = jasmine.createSpyObj<HttpClient>('HttpClient', ['get', 'patch']);
    http.patch.and.returnValue(of(undefined));
    const service = new NotificationService(http);

    await firstValueFrom(service.markAsRead('notification-id'));

    expect(http.patch).toHaveBeenCalledOnceWith('/api/notifications/notification-id/read', null);
  });
});
