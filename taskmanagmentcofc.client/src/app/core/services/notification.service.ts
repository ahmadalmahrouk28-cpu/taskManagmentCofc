import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { NotificationItem } from '../models/notification.models';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(private readonly http: HttpClient) { }

  getNotifications(): Observable<NotificationItem[]> {
    return this.http.get<NotificationItem[]>('/api/notifications');
  }

  markAsRead(notificationId: string): Observable<void> {
    return this.http.patch<void>(`/api/notifications/${notificationId}/read`, null);
  }
}
