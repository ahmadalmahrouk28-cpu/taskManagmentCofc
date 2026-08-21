import { TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { TaskItemStatus, TaskListItem } from '../../../core/models/task.models';
import { AdminUsersService } from '../../../core/services/admin-users.service';
import { TasksService } from '../../../core/services/tasks.service';
import { AdminModule } from '../admin.module';
import { AdminTasksComponent } from './admin-tasks.component';

describe('AdminTasksComponent', () => {
  it('removes the initial loading state without requiring a filter change', async () => {
    const tasks$ = new Subject<TaskListItem[]>();
    const tasksService = jasmine.createSpyObj<TasksService>('TasksService', ['getTasks']);
    const usersService = jasmine.createSpyObj<AdminUsersService>('AdminUsersService', ['getUsers']);
    tasksService.getTasks.and.returnValue(tasks$);
    usersService.getUsers.and.returnValue(of([]));
    TestBed.configureTestingModule({
      imports: [AdminModule],
      providers: [
        { provide: TasksService, useValue: tasksService },
        { provide: AdminUsersService, useValue: usersService }
      ]
    });
    const fixture = TestBed.createComponent(AdminTasksComponent);

    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('جارٍ تحميل المهام');

    tasks$.next([]);
    tasks$.complete();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).not.toContain('جارٍ تحميل المهام');
    expect(fixture.nativeElement.textContent).toContain('لا توجد مهام مطابقة');

  });

  it('keeps task form and delete modal content available', () => {
    const tasksService = jasmine.createSpyObj<TasksService>('TasksService', ['getTasks']);
    const usersService = jasmine.createSpyObj<AdminUsersService>('AdminUsersService', ['getUsers']);
    tasksService.getTasks.and.returnValue(of([]));
    usersService.getUsers.and.returnValue(of([]));
    TestBed.configureTestingModule({
      imports: [AdminModule],
      providers: [
        { provide: TasksService, useValue: tasksService },
        { provide: AdminUsersService, useValue: usersService }
      ]
    });
    const formFixture = TestBed.createComponent(AdminTasksComponent);
    formFixture.componentInstance.openCreate();
    formFixture.detectChanges();
    const formModal = formFixture.nativeElement.querySelector('.modal') as HTMLElement;
    expect(getComputedStyle(formModal).position).toBe('fixed');
    const formDialog = formModal.querySelector('.modal-dialog') as HTMLElement;
    expect(formDialog).toBeTruthy();
    expect(formDialog.classList).toContain('modal-lg');
    expect(formDialog.classList).toContain('modal-dialog-scrollable');
    expect(formModal.querySelector('.task-form-grid')).toBeTruthy();
    expect(formModal.querySelector('#task-title')).toBeTruthy();
    expect(formModal.querySelector('#task-description')).toBeTruthy();
    expect(formModal.querySelector('#task-assignee')).toBeTruthy();
    expect(formModal.querySelector('.modal-footer')?.textContent).toContain('حفظ');

    const deleteFixture = TestBed.createComponent(AdminTasksComponent);
    deleteFixture.componentInstance.deleteTarget = {
      id: 'task-id', title: 'Task', description: 'Description', status: TaskItemStatus.Pending,
      assignedTo: null, createdAtUtc: '2026-08-20T00:00:00Z', updatedAtUtc: '2026-08-20T00:00:00Z'
    };
    deleteFixture.detectChanges();
    const deleteModal = deleteFixture.nativeElement.querySelector('.modal') as HTMLElement;
    expect(deleteModal.querySelector('.modal-dialog-scrollable')).toBeTruthy();
    expect(deleteModal.querySelector('.modal-footer')?.textContent).toContain('حذف');
  });
});
