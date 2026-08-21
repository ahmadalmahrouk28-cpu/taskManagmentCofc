import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MessageResponse } from '../models/api.models';
import { PendingRegistration, RejectRegistrationRequest } from '../models/user.models';

@Injectable({ providedIn: 'root' })
export class AdminRegistrationsService {
  constructor(private readonly http: HttpClient) { }

  getPending(): Observable<PendingRegistration[]> {
    return this.http.get<PendingRegistration[]>('/api/admin/registrations/pending');
  }

  approve(userId: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`/api/admin/registrations/${userId}/approve`, {});
  }

  reject(userId: string, reason: string): Observable<MessageResponse> {
    const request: RejectRegistrationRequest = { reason };
    return this.http.post<MessageResponse>(`/api/admin/registrations/${userId}/reject`, request);
  }
}
