export interface MessageResponse {
  message: string;
}

export interface ApiErrorResponse {
  code?: string;
  message?: string;
  reason?: string;
  errors?: Record<string, string[]>;
  traceId?: string;
}
