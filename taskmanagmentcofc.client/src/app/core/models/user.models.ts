import { UserRole, UserStatus } from './auth.models';

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface CreateAdminUserRequest {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
}

export interface UpdateAdminUserRequest {
  fullName: string;
  email: string;
  role: UserRole;
}

export interface PendingRegistration {
  id: string;
  fullName: string;
  email: string;
  status: UserStatus;
  createdAtUtc: string;
}

export interface RejectRegistrationRequest {
  reason: string;
}
