import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { of } from 'rxjs';
import { UserRole, UserStatus } from '../../../core/models/auth.models';
import { AuthService } from '../../../core/services/auth.service';
import { UserRoleLabelPipe } from '../../pipes/user-role-label.pipe';
import { AppNavbarComponent } from './app-navbar.component';

@Component({
  selector: 'app-notification-menu',
  standalone: false,
  template: ''
})
class NotificationMenuStubComponent { }

describe('AppNavbarComponent', () => {
  let fixture: ComponentFixture<AppNavbarComponent>;

  beforeEach(async () => {
    const admin = {
      id: 'f5c1d25f-0cc6-4809-93d2-c3321df07a9c',
      fullName: 'مدير النظام',
      email: 'admin@example.com',
      role: UserRole.Admin,
      status: UserStatus.Active
    };

    await TestBed.configureTestingModule({
      declarations: [AppNavbarComponent, UserRoleLabelPipe, NotificationMenuStubComponent],
      imports: [RouterModule.forRoot([])],
      providers: [{
        provide: AuthService,
        useValue: { currentUser: admin, currentUser$: of(admin) }
      }]
    }).compileComponents();

    fixture = TestBed.createComponent(AppNavbarComponent);
    fixture.detectChanges();
  });

  it('shows the current admin name and role', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('مدير النظام');
    expect(text).toContain('مسؤول');
  });

  it('links the brand to the admin dashboard', () => {
    const brand = fixture.nativeElement.querySelector('.navbar-brand') as HTMLAnchorElement;
    expect(brand.getAttribute('href')).toBe('/admin/dashboard');
  });

  it('shows the shared notification menu for an authenticated user', () => {
    expect(fixture.nativeElement.querySelector('app-notification-menu')).toBeTruthy();
  });
});
