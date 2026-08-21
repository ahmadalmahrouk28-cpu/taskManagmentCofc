import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CreateTaskRequest,
  TaskDetails,
  TaskItemStatus,
  TaskListItem,
  UpdateTaskRequest,
  UpdateTaskStatusRequest
} from '../models/task.models';

@Injectable({ providedIn: 'root' })
export class TasksService {
  constructor(private readonly http: HttpClient) { }

  getTasks(
    search?: string,
    status?: TaskItemStatus,
    assignedToUserId?: string
  ): Observable<TaskListItem[]> {
    let params = new HttpParams();
    if (search?.trim()) {
      params = params.set('search', search.trim());
    }
    if (status !== undefined) {
      params = params.set('status', status);
    }
    if (assignedToUserId) {
      params = params.set('assignedToUserId', assignedToUserId);
    }

    return this.http.get<TaskListItem[]>('/api/tasks', { params });
  }

  getTask(id: string): Observable<TaskDetails> {
    return this.http.get<TaskDetails>(`/api/tasks/${id}`);
  }

  createTask(request: CreateTaskRequest): Observable<TaskDetails> {
    return this.http.post<TaskDetails>('/api/tasks', request);
  }

  updateTask(id: string, request: UpdateTaskRequest): Observable<TaskDetails> {
    return this.http.put<TaskDetails>(`/api/tasks/${id}`, request);
  }

  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`/api/tasks/${id}`);
  }

  updateStatus(id: string, status: TaskItemStatus): Observable<TaskDetails> {
    const request: UpdateTaskStatusRequest = { status };
    return this.http.patch<TaskDetails>(`/api/tasks/${id}/status`, request);
  }
}
