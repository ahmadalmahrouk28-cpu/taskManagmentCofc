import { TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { UserRole, UserStatus } from '../../../core/models/auth.models';
import { AdminUser } from '../../../core/models/user.models';
import { AdminUsersService } from '../../../core/services/admin-users.service';
import { AdminModule } from '../admin.module';
import { AdminUsersComponent } from './admin-users.component';

describe('AdminUsersComponent', () => {
  it('removes the initial loading state without requiring a filter change', async () => {
    const users$ = new Subject<AdminUser[]>();
    const service = jasmine.createSpyObj<AdminUsersService>('AdminUsersService', ['getUsers']);
    service.getUsers.and.returnValue(users$);
    TestBed.configureTestingModule({
      imports: [AdminModule],
      providers: [{ provide: AdminUsersService, useValue: service }]
    });
    const fixture = TestBed.createComponent(AdminUsersComponent);

    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('جارٍ تحميل المستخدمين');

    users$.next([]);
    users$.complete();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).not.toContain('جارٍ تحميل المستخدمين');
    expect(fixture.nativeElement.textContent).toContain('لا يوجد مستخدمون مطابقون');

  });

  it('keeps user form and delete modal content available', () => {
    const service = jasmine.createSpyObj<AdminUsersService>('AdminUsersService', ['getUsers']);
    service.getUsers.and.returnValue(of([]));
    TestBed.configureTestingModule({
      imports: [AdminModule],
      providers: [{ provide: AdminUsersService, useValue: service }]
    });
    const formFixture = TestBed.createComponent(AdminUsersComponent);
    formFixture.componentInstance.openCreate();
    formFixture.detectChanges();
    const formModal = formFixture.nativeElement.querySelector('.modal') as HTMLElement;
    expect(getComputedStyle(formModal).position).toBe('fixed');
    const formDialog = formModal.querySelector('.modal-dialog') as HTMLElement;
    expect(formDialog).toBeTruthy();
    expect(formDialog.classList).toContain('modal-lg');
    expect(formDialog.classList).toContain('modal-dialog-scrollable');
    expect(formModal.querySelector('#admin-user-name')).toBeTruthy();
    expect(formModal.querySelector('#admin-user-email')).toBeTruthy();
    expect(formModal.querySelector('#admin-user-password')).toBeTruthy();
    expect(formModal.querySelector('#admin-user-confirm-password')).toBeTruthy();
    expect(formModal.querySelector('.modal-footer')?.textContent).toContain('حفظ');

    const deleteFixture = TestBed.createComponent(AdminUsersComponent);
    deleteFixture.componentInstance.deleteTarget = {
      id: 'user-id', fullName: 'Employee', email: 'employee@example.com', role: UserRole.Employee,
      status: UserStatus.Active, createdAtUtc: '2026-08-20T00:00:00Z', updatedAtUtc: '2026-08-20T00:00:00Z'
    };
    deleteFixture.detectChanges();
    const deleteModal = deleteFixture.nativeElement.querySelector('.modal') as HTMLElement;
    expect(deleteModal.querySelector('.modal-dialog-scrollable')).toBeTruthy();
    expect(deleteModal.querySelector('.modal-footer')?.textContent).toContain('حذف');
  });
});
