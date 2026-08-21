import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom, of, throwError } from 'rxjs';
import { AuthResponse, RegisterRequest } from '../models/auth.models';
import { UserRole, UserStatus } from '../models/auth.models';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';

describe('AuthService session restoration', () => {
  const session = {
    accessToken: 'valid-token',
    expiresAtUtc: new Date(Date.now() + 60_000).toISOString(),
    user: {
      id: '30a52a2e-51f2-4756-89f3-29ca030ee64b',
      fullName: 'Test User',
      email: 'user@example.com',
      role: UserRole.Employee,
      status: UserStatus.Active
    }
  };

  afterEach(() => sessionStorage.clear());

  it('restores a valid session and current user after service recreation', () => {
    const tokenService = new TokenService('browser' as unknown as object);
    tokenService.saveSession(session);

    const http = {} as HttpClient;
    const router = { navigateByUrl: () => Promise.resolve(true) } as unknown as Router;
    const authService = new AuthService(http, tokenService, router);

    expect(authService.isAuthenticated()).toBe(true);
    expect(authService.getAccessToken()).toBe(session.accessToken);
    expect(authService.currentUser).toEqual(session.user);
  });

  it('clears an expired session', () => {
    const tokenService = new TokenService('browser' as unknown as object);
    tokenService.saveSession({
      ...session,
      expiresAtUtc: new Date(Date.now() - 60_000).toISOString()
    });

    expect(tokenService.getAccessToken()).toBeNull();
    expect(sessionStorage.length).toBe(0);
  });

  it('clears a session with an invalid expiration value', () => {
    const tokenService = new TokenService('browser' as unknown as object);
    tokenService.saveSession({ ...session, expiresAtUtc: 'invalid-date' });

    expect(tokenService.getAccessToken()).toBeNull();
    expect(sessionStorage.length).toBe(0);
  });

  it('clears the session and navigates to login on logout', () => {
    const tokenService = new TokenService('browser' as unknown as object);
    tokenService.saveSession(session);
    let destination = '';
    const http = {} as HttpClient;
    const router = {
      navigateByUrl: (url: string) => {
        destination = url;
        return Promise.resolve(true);
      }
    } as unknown as Router;
    const authService = new AuthService(http, tokenService, router);

    authService.logout();

    expect(authService.currentUser).toBeNull();
    expect(authService.isAuthenticated()).toBe(false);
    expect(destination).toBe('/login');
  });

  it('validates a restored session through the current-user endpoint', async () => {
    const tokenService = new TokenService('browser' as unknown as object);
    tokenService.saveSession(session);
    let getCalls = 0;
    const http = {
      get: () => {
        getCalls += 1;
        return of(session.user);
      }
    } as unknown as HttpClient;
    const router = { navigateByUrl: () => Promise.resolve(true) } as unknown as Router;
    const authService = new AuthService(http, tokenService, router);

    const user = await firstValueFrom(authService.validateCurrentSession());

    expect(user).toEqual(session.user);
    expect(getCalls).toBe(1);
  });

  it('does not clear the session after a 403 response', async () => {
    const tokenService = new TokenService('browser' as unknown as object);
    tokenService.saveSession(session);
    const http = {
      get: () => throwError(() => new HttpErrorResponse({ status: 403 }))
    } as unknown as HttpClient;
    const router = { navigateByUrl: () => Promise.resolve(true) } as unknown as Router;
    const authService = new AuthService(http, tokenService, router);

    const user = await firstValueFrom(authService.validateCurrentSession());

    expect(user).toEqual(session.user);
    expect(authService.isAuthenticated()).toBe(true);
  });

  it('logs in, stores the session, and updates the current user', async () => {
    const tokenService = new TokenService('browser' as unknown as object);
    let postedUrl = '';
    const http = {
      post: (url: string) => {
        postedUrl = url;
        return of(session as AuthResponse);
      }
    } as unknown as HttpClient;
    const router = { navigateByUrl: () => Promise.resolve(true) } as unknown as Router;
    const authService = new AuthService(http, tokenService, router);

    const response = await firstValueFrom(authService.login({
      email: session.user.email,
      password: 'Password123'
    }));

    expect(postedUrl).toBe('/api/auth/login');
    expect(response.accessToken).toBe(session.accessToken);
    expect(authService.currentUser).toEqual(session.user);
    expect(tokenService.getAccessToken()).toBe(session.accessToken);
  });

  it('registers through the public registration endpoint', async () => {
    const tokenService = new TokenService('browser' as unknown as object);
    let postedUrl = '';
    let postedRequest: RegisterRequest | null = null;
    const http = {
      post: (url: string, request: RegisterRequest) => {
        postedUrl = url;
        postedRequest = request;
        return of({ message: 'pending' });
      }
    } as unknown as HttpClient;
    const router = { navigateByUrl: () => Promise.resolve(true) } as unknown as Router;
    const authService = new AuthService(http, tokenService, router);
    const request: RegisterRequest = {
      fullName: 'New Employee',
      email: 'new@example.com',
      password: 'Password123',
      confirmPassword: 'Password123'
    };

    await firstValueFrom(authService.register(request));

    expect(postedUrl).toBe('/api/auth/register');
    expect(postedRequest as RegisterRequest | null).toEqual(request);
  });
});
