import { CommonModule } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, convertToParamMap, RouterModule } from '@angular/router';
import { of } from 'rxjs';
import { TaskDetails, TaskItemStatus } from '../../../core/models/task.models';
import { TasksService } from '../../../core/services/tasks.service';
import { TaskStatusLabelPipe } from '../../../shared/pipes/task-status-label.pipe';
import { EmployeeTaskDetailsComponent } from './employee-task-details.component';

describe('EmployeeTaskDetailsComponent', () => {
  const task: TaskDetails = {
    id: 'task-id',
    title: 'Assigned task',
    description: 'Description',
    status: TaskItemStatus.Pending,
    assignedTo: { id: 'employee-id', fullName: 'Employee', email: 'employee@example.com' },
    createdBy: { id: 'admin-id', fullName: 'Admin' },
    createdAtUtc: '2026-08-20T00:00:00Z',
    updatedAtUtc: '2026-08-20T00:00:00Z'
  };

  it('updates the employee own-task status to an allowed value', () => {
    const service = jasmine.createSpyObj<TasksService>('TasksService', ['getTask', 'updateStatus']);
    service.getTask.and.returnValue(of(task));
    service.updateStatus.and.returnValue(of({ ...task, status: TaskItemStatus.Completed }));
    TestBed.configureTestingModule({
      declarations: [EmployeeTaskDetailsComponent, TaskStatusLabelPipe],
      imports: [CommonModule, ReactiveFormsModule, RouterModule],
      providers: [
        { provide: TasksService, useValue: service },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: task.id }) } } }
      ]
    });
    const fixture = TestBed.createComponent(EmployeeTaskDetailsComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    component.statusForm.setValue({ status: TaskItemStatus.Completed });

    const statusSelect = fixture.nativeElement.querySelector('#employee-status-update') as HTMLSelectElement;
    statusSelect.dispatchEvent(new Event('change'));

    expect(service.updateStatus).toHaveBeenCalledWith(task.id, TaskItemStatus.Completed);
    expect(component.task?.status).toBe(TaskItemStatus.Completed);
    expect(component.allowedStatuses).toEqual([TaskItemStatus.InProgress, TaskItemStatus.Completed]);
  });
});
