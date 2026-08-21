import { Pipe, PipeTransform } from '@angular/core';
import { UserStatus } from '../../core/models/auth.models';

@Pipe({ name: 'userStatusLabel', standalone: false })
export class UserStatusLabelPipe implements PipeTransform {
  transform(status: UserStatus): string {
    switch (status) {
      case UserStatus.Pending:
        return 'بانتظار الموافقة';
      case UserStatus.Active:
        return 'مفعّل';
      case UserStatus.Rejected:
        return 'مرفوض';
      default:
        return 'غير معروفة';
    }
  }
}
