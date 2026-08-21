import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { AdminRoutingModule } from './admin-routing.module';
import { AdminDashboardComponent } from './dashboard/admin-dashboard.component';
import { AdminLayoutComponent } from './layout/admin-layout.component';
import { AdminRegistrationsComponent } from './registrations/admin-registrations.component';
import { AdminTasksComponent } from './tasks/admin-tasks.component';
import { AdminTaskStatisticsComponent } from './task-statistics/admin-task-statistics.component';
import { AdminUsersComponent } from './users/admin-users.component';

@NgModule({
  declarations: [
    AdminLayoutComponent,
    AdminDashboardComponent,
    AdminTasksComponent,
    AdminTaskStatisticsComponent,
    AdminUsersComponent,
    AdminRegistrationsComponent
  ],
  imports: [CommonModule, ReactiveFormsModule, SharedModule, AdminRoutingModule]
})
export class AdminModule { }
