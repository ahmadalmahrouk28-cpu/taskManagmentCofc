import { CommonModule } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { AdminDashboard } from '../../../core/models/dashboard.models';
import { AdminDashboardService } from '../../../core/services/admin-dashboard.service';
import { AdminDashboardComponent } from './admin-dashboard.component';

describe('AdminDashboardComponent', () => {
  it('renders dashboard data when the asynchronous request completes without user interaction', async () => {
    const dashboard$ = new Subject<AdminDashboard>();
    const service = jasmine.createSpyObj<AdminDashboardService>('AdminDashboardService', ['getDashboard']);
    service.getDashboard.and.returnValue(dashboard$);
    TestBed.configureTestingModule({
      declarations: [AdminDashboardComponent],
      imports: [CommonModule],
      providers: [{ provide: AdminDashboardService, useValue: service }]
    });
    const fixture = TestBed.createComponent(AdminDashboardComponent);

    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('جارٍ تحميل الإحصاءات');

    dashboard$.next({
      totalUsers: 1,
      totalEmployees: 0,
      activeEmployees: 0,
      pendingRegistrations: 0,
      rejectedUsers: 0,
      totalTasks: 0,
      pendingTasks: 0,
      inProgressTasks: 0,
      completedTasks: 0
    });
    dashboard$.complete();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).not.toContain('جارٍ تحميل الإحصاءات');
    expect(fixture.nativeElement.textContent).toContain('إجمالي المهام');
  });
});
