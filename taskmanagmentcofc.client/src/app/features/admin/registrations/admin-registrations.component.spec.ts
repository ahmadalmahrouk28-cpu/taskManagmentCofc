import { CommonModule } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Subject, of } from 'rxjs';
import { UserStatus } from '../../../core/models/auth.models';
import { PendingRegistration } from '../../../core/models/user.models';
import { AdminRegistrationsService } from '../../../core/services/admin-registrations.service';
import { AdminRegistrationsComponent } from './admin-registrations.component';

describe('AdminRegistrationsComponent', () => {
  const registration: PendingRegistration = {
    id: 'registration-id',
    fullName: 'Pending Employee',
    email: 'pending@example.com',
    status: UserStatus.Pending,
    createdAtUtc: '2026-08-20T00:00:00Z'
  };
  let service: jasmine.SpyObj<AdminRegistrationsService>;
  let component: AdminRegistrationsComponent;

  beforeEach(() => {
    service = jasmine.createSpyObj<AdminRegistrationsService>(
      'AdminRegistrationsService',
      ['getPending', 'approve', 'reject']
    );
    service.getPending.and.returnValue(of([registration]));
    service.approve.and.returnValue(of({ message: 'Approved' }));
    service.reject.and.returnValue(of({ message: 'Rejected' }));
    TestBed.configureTestingModule({
      declarations: [AdminRegistrationsComponent],
      imports: [CommonModule, ReactiveFormsModule],
      providers: [{ provide: AdminRegistrationsService, useValue: service }]
    });
    component = TestBed.createComponent(AdminRegistrationsComponent).componentInstance;
  });

  it('loads pending registrations', () => {
    component.ngOnInit();

    expect(service.getPending).toHaveBeenCalled();
    expect(component.registrations).toEqual([registration]);
  });

  it('removes the loading state when an asynchronous request completes without user interaction', async () => {
    const registrations$ = new Subject<PendingRegistration[]>();
    service.getPending.and.returnValue(registrations$);
    const fixture = TestBed.createComponent(AdminRegistrationsComponent);

    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('جارٍ تحميل طلبات التسجيل');

    registrations$.next([]);
    registrations$.complete();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).not.toContain('جارٍ تحميل طلبات التسجيل');
    expect(fixture.nativeElement.textContent).toContain('لا توجد طلبات تسجيل معلقة حاليًا');
  });

  it('approves the selected registration and reloads the list', () => {
    component.approvalTarget = registration;

    component.approve();

    expect(service.approve).toHaveBeenCalledWith(registration.id);
    expect(component.approvalTarget).toBeNull();
    expect(component.successMessage).toContain('تمت الموافقة');
    expect(service.getPending).toHaveBeenCalled();
  });

  it('requires a reason and sends it when rejecting', () => {
    component.openReject(registration);
    component.reject();
    expect(service.reject).not.toHaveBeenCalled();

    component.rejectForm.setValue({ reason: '  بيانات غير مكتملة  ' });
    component.reject();

    expect(service.reject).toHaveBeenCalledWith(registration.id, 'بيانات غير مكتملة');
    expect(component.rejectTarget).toBeNull();
    expect(component.successMessage).toContain('تم رفض');
  });

  it('keeps approval and rejection modal actions available', () => {
    const approvalFixture = TestBed.createComponent(AdminRegistrationsComponent);
    approvalFixture.componentInstance.approvalTarget = registration;
    approvalFixture.detectChanges();
    const approvalModal = approvalFixture.nativeElement.querySelector('.modal') as HTMLElement;
    expect(approvalModal.querySelector('.modal-dialog-scrollable')).toBeTruthy();
    expect(approvalModal.querySelector('.modal-footer')?.textContent).toContain('موافقة');

    const rejectionFixture = TestBed.createComponent(AdminRegistrationsComponent);
    rejectionFixture.componentInstance.openReject(registration);
    rejectionFixture.detectChanges();
    const rejectionModal = rejectionFixture.nativeElement.querySelector('.modal') as HTMLElement;
    expect(rejectionModal.querySelector('.modal-dialog-scrollable')).toBeTruthy();
    expect(rejectionModal.querySelector('#rejection-reason')).toBeTruthy();
    expect(rejectionModal.querySelector('.modal-footer')?.textContent).toContain('تأكيد الرفض');
  });
});
