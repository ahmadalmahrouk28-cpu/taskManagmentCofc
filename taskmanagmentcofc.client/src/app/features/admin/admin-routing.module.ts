import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminDashboardComponent } from './dashboard/admin-dashboard.component';
import { AdminLayoutComponent } from './layout/admin-layout.component';
import { AdminRegistrationsComponent } from './registrations/admin-registrations.component';
import { AdminTasksComponent } from './tasks/admin-tasks.component';
import { AdminTaskStatisticsComponent } from './task-statistics/admin-task-statistics.component';
import { AdminUsersComponent } from './users/admin-users.component';

const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: 'dashboard', component: AdminDashboardComponent, title: 'لوحة التحكم' },
      { path: 'tasks', component: AdminTasksComponent, title: 'إدارة المهام' },
      { path: 'task-statistics', component: AdminTaskStatisticsComponent, title: 'إحصائية المهام' },
      { path: 'users', component: AdminUsersComponent, title: 'إدارة المستخدمين' },
      { path: 'registrations', component: AdminRegistrationsComponent, title: 'طلبات التسجيل' },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
