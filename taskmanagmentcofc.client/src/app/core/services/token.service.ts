import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { AuthResponse, User } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly sessionKey = 'task-management-session';

  constructor(@Inject(PLATFORM_ID) private readonly platformId: object) { }

  saveSession(session: AuthResponse): void {
    this.getStorage()?.setItem(this.sessionKey, JSON.stringify(session));
  }

  getSession(): AuthResponse | null {
    const storage = this.getStorage();
    const value = storage?.getItem(this.sessionKey);
    if (!value) {
      return null;
    }

    try {
      const session = JSON.parse(value) as AuthResponse;
      const expiresAt = Date.parse(session.expiresAtUtc);
      if (!session.accessToken || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
        this.clearSession();
        return null;
      }

      return session;
    } catch {
      this.clearSession();
      return null;
    }
  }

  getAccessToken(): string | null {
    return this.getSession()?.accessToken ?? null;
  }

  updateUser(user: User): void {
    const session = this.getSession();
    if (session) {
      this.saveSession({ ...session, user });
    }
  }

  clearSession(): void {
    this.getStorage()?.removeItem(this.sessionKey);
  }

  private getStorage(): Storage | null {
    return isPlatformBrowser(this.platformId) ? sessionStorage : null;
  }
}
