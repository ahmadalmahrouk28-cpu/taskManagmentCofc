import { CommonModule } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { EmployeeTaskStatistics } from '../../../core/models/dashboard.models';
import { AdminDashboardService } from '../../../core/services/admin-dashboard.service';
import { AdminTaskStatisticsComponent } from './admin-task-statistics.component';

describe('AdminTaskStatisticsComponent', () => {
  it('renders every employee task count after loading completes', async () => {
    const statistics$ = new Subject<EmployeeTaskStatistics[]>();
    const service = jasmine.createSpyObj<AdminDashboardService>('AdminDashboardService', ['getTaskStatistics']);
    service.getTaskStatistics.and.returnValue(statistics$);
    TestBed.configureTestingModule({
      declarations: [AdminTaskStatisticsComponent],
      imports: [CommonModule],
      providers: [{ provide: AdminDashboardService, useValue: service }]
    });
    const fixture = TestBed.createComponent(AdminTaskStatisticsComponent);

    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('جارٍ تحميل إحصائية المهام');

    statistics$.next([
      {
        employeeId: 'employee-a',
        fullName: 'الموظف الأول',
        email: 'a@example.com',
        totalTasks: 3,
        pendingTasks: 1,
        inProgressTasks: 1,
        completedTasks: 1
      },
      {
        employeeId: 'employee-b',
        fullName: 'الموظف الثاني',
        email: 'b@example.com',
        totalTasks: 0,
        pendingTasks: 0,
        inProgressTasks: 0,
        completedTasks: 0
      }
    ]);
    statistics$.complete();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).not.toContain('جارٍ تحميل إحصائية المهام');
    expect(text).toContain('الموظف الأول');
    expect(text).toContain('الموظف الثاني');
    expect(text).toContain('إجمالي المهام المسندة');
    expect(fixture.componentInstance.totalAssignedTasks).toBe(3);
  });

  it('shows an empty state when no employees exist', () => {
    const service = jasmine.createSpyObj<AdminDashboardService>('AdminDashboardService', ['getTaskStatistics']);
    service.getTaskStatistics.and.returnValue(of([]));
    TestBed.configureTestingModule({
      declarations: [AdminTaskStatisticsComponent],
      imports: [CommonModule],
      providers: [{ provide: AdminDashboardService, useValue: service }]
    });
    const fixture = TestBed.createComponent(AdminTaskStatisticsComponent);

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('لا يوجد موظفون لعرض إحصائياتهم حاليًا');
  });
});
