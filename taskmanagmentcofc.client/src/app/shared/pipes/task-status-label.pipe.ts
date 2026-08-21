import { Pipe, PipeTransform } from '@angular/core';
import { TaskItemStatus } from '../../core/models/task.models';

@Pipe({
  name: 'taskStatusLabel',
  standalone: false
})
export class TaskStatusLabelPipe implements PipeTransform {
  transform(status: TaskItemStatus): string {
    switch (status) {
      case TaskItemStatus.Pending:
        return 'قيد الانتظار';
      case TaskItemStatus.InProgress:
        return 'قيد الإنجاز';
      case TaskItemStatus.Completed:
        return 'مكتملة';
      default:
        return 'غير معروفة';
    }
  }
}
