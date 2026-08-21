import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { TaskItemStatus, TaskListItem } from '../../../core/models/task.models';
import { TasksService } from '../../../core/services/tasks.service';
import { EmployeeTasksComponent } from './employee-tasks.component';

describe('EmployeeTasksComponent', () => {
  const task: TaskListItem = {
    id: 'task-id',
    title: 'Assigned task',
    description: 'Description',
    status: TaskItemStatus.Pending,
    assignedTo: { id: 'employee-id', fullName: 'Employee', email: 'employee@example.com' },
    createdAtUtc: '2026-08-20T00:00:00Z',
    updatedAtUtc: '2026-08-20T00:00:00Z'
  };
  let service: jasmine.SpyObj<TasksService>;
  let component: EmployeeTasksComponent;

  beforeEach(() => {
    service = jasmine.createSpyObj<TasksService>('TasksService', ['getTasks']);
    service.getTasks.and.returnValue(of([task]));
    TestBed.configureTestingModule({
      declarations: [EmployeeTasksComponent],
      imports: [ReactiveFormsModule],
      providers: [{ provide: TasksService, useValue: service }]
    });
    TestBed.overrideComponent(EmployeeTasksComponent, { set: { template: '' } });
    component = TestBed.createComponent(EmployeeTasksComponent).componentInstance;
  });

  it('loads the task list without sending a user identifier', () => {
    component.ngOnInit();

    expect(service.getTasks).toHaveBeenCalledWith('', undefined);
    expect(component.tasks).toEqual([task]);
  });

  it('uses API search and status filters after debounce', done => {
    component.ngOnInit();
    service.getTasks.calls.reset();

    component.filters.setValue({ search: 'report', status: TaskItemStatus.InProgress });
    setTimeout(() => {
      expect(service.getTasks).toHaveBeenCalledWith('report', TaskItemStatus.InProgress);
      done();
    }, 350);
  });
});
