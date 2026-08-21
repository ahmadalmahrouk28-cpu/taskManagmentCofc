import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { RegisterComponent } from './register.component';

describe('RegisterComponent', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;

  beforeEach(() => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['register']);
    TestBed.configureTestingModule({
      declarations: [RegisterComponent],
      imports: [ReactiveFormsModule],
      providers: [{ provide: AuthService, useValue: authService }]
    });
    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
  });

  it('requires all registration fields', () => {
    component.submit();

    expect(component.form.invalid).toBe(true);
    expect(authService.register).not.toHaveBeenCalled();
  });

  it('rejects mismatching confirmation password', () => {
    component.form.setValue({
      fullName: 'Employee',
      email: 'employee@example.com',
      password: 'Password123',
      confirmPassword: 'Different123'
    });

    component.submit();

    expect(component.form.hasError('passwordMismatch')).toBe(true);
    expect(authService.register).not.toHaveBeenCalled();
  });

  it('shows the pending-approval message after successful registration', () => {
    authService.register.and.returnValue(of({ message: 'Accepted' }));
    component.form.setValue({
      fullName: 'Employee',
      email: 'employee@example.com',
      password: 'Password123',
      confirmPassword: 'Password123'
    });

    component.submit();

    expect(authService.register).toHaveBeenCalled();
    expect(component.successMessage).toBe('تم إنشاء الحساب بنجاح، وهو الآن بانتظار موافقة المسؤول.');
    expect(component.form.getRawValue()).toEqual({ fullName: '', email: '', password: '', confirmPassword: '' });
  });

  it('allows the user to show and hide both password fields', () => {
    fixture.detectChanges();
    const password = fixture.nativeElement.querySelector('#register-password') as HTMLInputElement;
    const confirmation = fixture.nativeElement.querySelector('#confirm-password') as HTMLInputElement;
    const buttons = fixture.nativeElement.querySelectorAll('.password-toggle-button') as NodeListOf<HTMLButtonElement>;

    expect(password.type).toBe('password');
    expect(confirmation.type).toBe('password');

    buttons[0].click();
    buttons[1].click();
    fixture.detectChanges();

    expect(password.type).toBe('text');
    expect(confirmation.type).toBe('text');
  });

  it('places the password fields in separate full-width rows', () => {
    fixture.detectChanges();
    const passwordGroup = fixture.nativeElement.querySelector('#register-password')
      .closest('.input-group') as HTMLElement;
    const confirmationGroup = fixture.nativeElement.querySelector('#confirm-password')
      .closest('.input-group') as HTMLElement;

    expect(passwordGroup.parentElement?.classList.contains('col-md-6')).toBe(false);
    expect(confirmationGroup.parentElement?.classList.contains('col-md-6')).toBe(false);
  });

  it('keeps the form on the right and the visual content on the left on desktop', () => {
    fixture.detectChanges();
    const formColumn = fixture.nativeElement.querySelector('.auth-form-column') as HTMLElement;
    const visualColumn = fixture.nativeElement.querySelector('.auth-visual')?.parentElement as HTMLElement;

    expect(formColumn.classList.contains('order-lg-1')).toBe(true);
    expect(visualColumn.classList.contains('order-lg-2')).toBe(true);
  });
});
