import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthResponse, UserRole, UserStatus } from '../../../core/models/auth.models';
import { AuthService } from '../../../core/services/auth.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let component: LoginComponent;

  beforeEach(() => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['login']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    router.navigate.and.resolveTo(true);
    TestBed.configureTestingModule({
      declarations: [LoginComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router }
      ]
    });
    component = TestBed.createComponent(LoginComponent).componentInstance;
  });

  it('rejects an invalid form without calling the API', () => {
    component.submit();

    expect(component.form.invalid).toBe(true);
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('redirects an admin after successful login', () => {
    authService.login.and.returnValue(of(authResponse(UserRole.Admin)));
    component.form.setValue({ email: 'admin@example.com', password: 'Password123' });

    component.submit();

    expect(router.navigate).toHaveBeenCalledWith(['/admin/dashboard']);
  });

  it('shows the pending-account message', () => {
    authService.login.and.returnValue(throwError(() => new HttpErrorResponse({
      status: 403,
      error: { code: 'ACCOUNT_PENDING', message: 'Pending' }
    })));
    component.form.setValue({ email: 'pending@example.com', password: 'Password123' });

    component.submit();

    expect(component.errorMessage).toBe('حسابك ينتظر موافقة المسؤول.');
  });

  it('shows the rejection reason', () => {
    authService.login.and.returnValue(throwError(() => new HttpErrorResponse({
      status: 403,
      error: { code: 'ACCOUNT_REJECTED', message: 'Rejected', reason: 'بيانات ناقصة' }
    })));
    component.form.setValue({ email: 'rejected@example.com', password: 'Password123' });

    component.submit();

    expect(component.errorMessage).toContain('بيانات ناقصة');
  });

  function authResponse(role: UserRole): AuthResponse {
    return {
      accessToken: 'token',
      expiresAtUtc: new Date(Date.now() + 60_000).toISOString(),
      user: {
        id: 'user-id',
        fullName: 'User',
        email: 'user@example.com',
        role,
        status: UserStatus.Active
      }
    };
  }
});
