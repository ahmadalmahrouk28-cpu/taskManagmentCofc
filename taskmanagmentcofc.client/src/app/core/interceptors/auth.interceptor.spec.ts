import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpRequest,
  HttpResponse
} from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { AuthInterceptor } from './auth.interceptor';

class AuthServiceStub {
  accessToken: string | null = 'test-token';
  logoutCalls = 0;

  getAccessToken(): string | null {
    return this.accessToken;
  }

  logout(): void {
    this.logoutCalls += 1;
  }
}

class CapturingHandler implements HttpHandler {
  request: HttpRequest<unknown> | null = null;

  constructor(private readonly status?: number) { }

  handle(request: HttpRequest<unknown>): Observable<HttpEvent<unknown>> {
    this.request = request;
    return this.status
      ? throwError(() => new HttpErrorResponse({ status: this.status }))
      : of(new HttpResponse({ status: 200 }));
  }
}

describe('AuthInterceptor', () => {
  let authService: AuthServiceStub;
  let interceptor: AuthInterceptor;

  beforeEach(() => {
    authService = new AuthServiceStub();
    interceptor = new AuthInterceptor(authService as unknown as AuthService);
  });

  it('adds the bearer token only to protected API requests', () => {
    const protectedHandler = new CapturingHandler();
    interceptor.intercept(new HttpRequest('GET', '/api/auth/me'), protectedHandler).subscribe();

    const publicHandler = new CapturingHandler();
    interceptor.intercept(new HttpRequest('POST', '/api/auth/login', null), publicHandler).subscribe();

    const externalHandler = new CapturingHandler();
    interceptor.intercept(new HttpRequest('GET', '/assets/logo.svg'), externalHandler).subscribe();

    expect(protectedHandler.request?.headers.get('Authorization')).toBe('Bearer test-token');
    expect(publicHandler.request?.headers.has('Authorization')).toBe(false);
    expect(externalHandler.request?.headers.has('Authorization')).toBe(false);
  });

  it('does not add authorization when no access token exists', () => {
    authService.accessToken = null;
    const handler = new CapturingHandler();

    interceptor.intercept(new HttpRequest('GET', '/api/tasks'), handler).subscribe();

    expect(handler.request?.headers.has('Authorization')).toBe(false);
  });

  it('logs out after a 401 from a protected API request', () => {
    interceptor.intercept(
      new HttpRequest('GET', '/api/tasks'),
      new CapturingHandler(401)
    ).subscribe({ error: () => undefined });

    expect(authService.logoutCalls).toBe(1);
  });

  it('does not log out after a 403 response', () => {
    interceptor.intercept(
      new HttpRequest('GET', '/api/tasks'),
      new CapturingHandler(403)
    ).subscribe({ error: () => undefined });

    expect(authService.logoutCalls).toBe(0);
  });

  it('does not treat invalid login credentials as an expired session', () => {
    interceptor.intercept(
      new HttpRequest('POST', '/api/auth/login', null),
      new CapturingHandler(401)
    ).subscribe({ error: () => undefined });

    expect(authService.logoutCalls).toBe(0);
  });
});
