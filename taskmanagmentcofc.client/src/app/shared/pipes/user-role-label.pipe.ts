import { Pipe, PipeTransform } from '@angular/core';
import { UserRole } from '../../core/models/auth.models';

@Pipe({
  name: 'userRoleLabel',
  standalone: false
})
export class UserRoleLabelPipe implements PipeTransform {
  transform(role: UserRole): string {
    return role === UserRole.Admin ? 'مسؤول' : 'موظف';
  }
}
