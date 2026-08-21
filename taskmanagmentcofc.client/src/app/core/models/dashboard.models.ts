export interface AdminDashboard {
  totalUsers: number;
  totalEmployees: number;
  activeEmployees: number;
  pendingRegistrations: number;
  rejectedUsers: number;
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
}

export interface EmployeeTaskStatistics {
  employeeId: string;
  fullName: string;
  email: string;
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
}
