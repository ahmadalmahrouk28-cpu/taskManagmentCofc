import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AdminDashboard, EmployeeTaskStatistics } from '../models/dashboard.models';

@Injectable({ providedIn: 'root' })
export class AdminDashboardService {
  constructor(private readonly http: HttpClient) { }

  getDashboard(): Observable<AdminDashboard> {
    return this.http.get<AdminDashboard>('/api/admin/dashboard');
  }

  getTaskStatistics(): Observable<EmployeeTaskStatistics[]> {
    return this.http.get<EmployeeTaskStatistics[]>('/api/admin/dashboard/task-statistics');
  }
}
