import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, finalize, map, of, shareReplay, tap } from 'rxjs';
import { MessageResponse } from '../models/api.models';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../models/auth.models';
import { TokenService } from './token.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUserSubject: BehaviorSubject<User | null>;
  private sessionValidated = false;
  private validationRequest$: Observable<User | null> | null = null;

  readonly currentUser$: Observable<User | null>;

  constructor(
    private readonly http: HttpClient,
    private readonly tokenService: TokenService,
    private readonly router: Router
  ) {
    this.currentUserSubject = new BehaviorSubject<User | null>(this.tokenService.getSession()?.user ?? null);
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/login', request).pipe(
      tap(response => {
        this.tokenService.saveSession(response);
        this.currentUserSubject.next(response.user);
        this.sessionValidated = true;
      })
    );
  }

  register(request: RegisterRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>('/api/auth/register', request);
  }

  logout(redirectToLogin = true): void {
    this.clearSessionState();
    if (redirectToLogin) {
      void this.router.navigateByUrl('/login');
    }
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>('/api/auth/me').pipe(
      tap(user => {
        this.tokenService.updateUser(user);
        this.currentUserSubject.next(user);
      })
    );
  }

  getAccessToken(): string | null {
    return this.tokenService.getAccessToken();
  }

  isAuthenticated(): boolean {
    return this.getAccessToken() !== null;
  }

  validateCurrentSession(): Observable<User | null> {
    if (!this.isAuthenticated()) {
      this.clearSessionState();
      return of(null);
    }

    if (this.sessionValidated && this.currentUser) {
      return of(this.currentUser);
    }

    if (!this.validationRequest$) {
      this.validationRequest$ = this.getCurrentUser().pipe(
        tap(() => this.sessionValidated = true),
        map(user => user as User | null),
        catchError((error: HttpErrorResponse) => {
          if (error.status === 401) {
            this.clearSessionState();
            return of(null);
          }

          return of(this.currentUser);
        }),
        finalize(() => this.validationRequest$ = null),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }

    return this.validationRequest$;
  }

  private clearSessionState(): void {
    this.tokenService.clearSession();
    this.currentUserSubject.next(null);
    this.sessionValidated = false;
  }
}
