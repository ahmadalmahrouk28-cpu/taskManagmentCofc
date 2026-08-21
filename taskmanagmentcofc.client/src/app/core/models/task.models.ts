export enum TaskItemStatus {
  Pending = 1,
  InProgress = 2,
  Completed = 3
}

export interface TaskAssignee {
  id: string;
  fullName: string;
  email: string;
}

export interface TaskListItem {
  id: string;
  title: string;
  description: string;
  status: TaskItemStatus;
  assignedTo: TaskAssignee | null;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface TaskCreator {
  id: string;
  fullName: string;
}

export interface TaskDetails extends TaskListItem {
  createdBy: TaskCreator;
}

export interface CreateTaskRequest {
  title: string;
  description: string;
  assignedToUserId: string;
}

export interface UpdateTaskRequest extends CreateTaskRequest {
  status: TaskItemStatus;
}

export interface UpdateTaskStatusRequest {
  status: TaskItemStatus;
}
