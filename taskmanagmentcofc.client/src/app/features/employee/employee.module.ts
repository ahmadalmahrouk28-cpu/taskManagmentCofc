import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { EmployeeRoutingModule } from './employee-routing.module';
import { EmployeeLayoutComponent } from './layout/employee-layout.component';
import { EmployeeProfileComponent } from './profile/employee-profile.component';
import { EmployeeTaskDetailsComponent } from './task-details/employee-task-details.component';
import { EmployeeTasksComponent } from './tasks/employee-tasks.component';

@NgModule({
  declarations: [
    EmployeeLayoutComponent,
    EmployeeTasksComponent,
    EmployeeTaskDetailsComponent,
    EmployeeProfileComponent
  ],
  imports: [CommonModule, ReactiveFormsModule, SharedModule, EmployeeRoutingModule]
})
export class EmployeeModule { }
