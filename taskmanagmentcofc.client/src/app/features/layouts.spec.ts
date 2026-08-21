import { Component, EventEmitter, Input, Output, Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { AdminLayoutComponent } from './admin/layout/admin-layout.component';
import { EmployeeLayoutComponent } from './employee/layout/employee-layout.component';

@Component({
  selector: 'app-navbar',
  standalone: false,
  template: ''
})
class NavbarStubComponent {
  @Input() sidebarOpen = false;
  @Output() readonly sidebarToggle = new EventEmitter<void>();
}

class AuthServiceStub {
  logoutCalls = 0;

  logout(): void {
    this.logoutCalls += 1;
  }
}

describe('Role layouts', () => {
  let authService: AuthServiceStub;

  beforeEach(async () => {
    authService = new AuthServiceStub();
    await TestBed.configureTestingModule({
      declarations: [AdminLayoutComponent, EmployeeLayoutComponent, NavbarStubComponent],
      imports: [RouterModule.forRoot([])],
      providers: [{ provide: AuthService, useValue: authService }]
    }).compileComponents();
  });

  it('shows all admin navigation links', () => {
    const fixture = createFixture(AdminLayoutComponent);
    const text = fixture.nativeElement.textContent as string;
    const contentContainer = fixture.nativeElement.querySelector('.content-container') as HTMLElement;

    expect(text).toContain('لوحة التحكم');
    expect(text).toContain('المهام');
    expect(text).toContain('إحصائية المهام');
    expect(text).toContain('المستخدمون');
    expect(text).toContain('طلبات التسجيل');
    expect(text).toContain('تسجيل الخروج');
    expect(getComputedStyle(contentContainer).transform).toBe('none');
  });

  it('does not expose admin links in the employee layout', () => {
    const fixture = createFixture(EmployeeLayoutComponent);
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('مهامي');
    expect(text).toContain('الملف الشخصي');
    expect(text).toContain('تسجيل الخروج');
    expect(text).not.toContain('المستخدمون');
    expect(text).not.toContain('إحصائية المهام');
    expect(text).not.toContain('طلبات التسجيل');
  });

  it('logs out from both role layouts', () => {
    const adminFixture = createFixture(AdminLayoutComponent);
    const employeeFixture = createFixture(EmployeeLayoutComponent);

    clickLogout(adminFixture);
    clickLogout(employeeFixture);

    expect(authService.logoutCalls).toBe(2);
  });

  it('opens and closes the mobile sidebar from the same navbar control', () => {
    const fixture = createFixture(AdminLayoutComponent);
    const layout = fixture.componentInstance;

    layout.toggleSidebar();
    fixture.detectChanges();
    expect(layout.isSidebarOpen).toBe(true);

    layout.toggleSidebar();
    fixture.detectChanges();
    expect(layout.isSidebarOpen).toBe(false);
  });

  function createFixture<T>(component: Type<T>): ComponentFixture<T> {
    const fixture = TestBed.createComponent(component);
    fixture.detectChanges();
    return fixture;
  }

  function clickLogout<T>(fixture: ComponentFixture<T>): void {
    const button = fixture.nativeElement.querySelector('.logout-link') as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
  }
});
