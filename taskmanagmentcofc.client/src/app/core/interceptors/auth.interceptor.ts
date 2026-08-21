import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private readonly authService: AuthService) { }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const isApiRequest = request.url.startsWith('/api/');
    const isPublicAuthRequest = request.url === '/api/auth/login' || request.url === '/api/auth/register';
    const isProtectedApiRequest = isApiRequest && !isPublicAuthRequest;
    const token = isProtectedApiRequest ? this.authService.getAccessToken() : null;

    const outgoingRequest = isProtectedApiRequest && token
      ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : request;

    return next.handle(outgoingRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        if (isProtectedApiRequest && error.status === 401) {
          this.authService.logout();
        }

        return throwError(() => error);
      })
    );
  }
}
