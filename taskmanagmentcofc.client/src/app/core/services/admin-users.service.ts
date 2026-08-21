import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserRole, UserStatus } from '../models/auth.models';
import { AdminUser, CreateAdminUserRequest, UpdateAdminUserRequest } from '../models/user.models';

@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  constructor(private readonly http: HttpClient) { }

  getUsers(search?: string, role?: UserRole, status?: UserStatus): Observable<AdminUser[]> {
    let params = new HttpParams();
    if (search?.trim()) {
      params = params.set('search', search.trim());
    }
    if (role !== undefined) {
      params = params.set('role', role);
    }
    if (status !== undefined) {
      params = params.set('status', status);
    }

    return this.http.get<AdminUser[]>('/api/admin/users', { params });
  }

  createUser(request: CreateAdminUserRequest): Observable<AdminUser> {
    return this.http.post<AdminUser>('/api/admin/users', request);
  }

  updateUser(id: string, request: UpdateAdminUserRequest): Observable<AdminUser> {
    return this.http.put<AdminUser>(`/api/admin/users/${id}`, request);
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`/api/admin/users/${id}`);
  }
}
