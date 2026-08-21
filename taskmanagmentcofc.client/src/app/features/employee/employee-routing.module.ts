import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EmployeeLayoutComponent } from './layout/employee-layout.component';
import { EmployeeProfileComponent } from './profile/employee-profile.component';
import { EmployeeTaskDetailsComponent } from './task-details/employee-task-details.component';
import { EmployeeTasksComponent } from './tasks/employee-tasks.component';

const routes: Routes = [
  {
    path: '',
    component: EmployeeLayoutComponent,
    children: [
      { path: 'tasks', component: EmployeeTasksComponent, title: 'مهامي' },
      { path: 'tasks/:id', component: EmployeeTaskDetailsComponent, title: 'تفاصيل المهمة' },
      { path: 'profile', component: EmployeeProfileComponent, title: 'الملف الشخصي' },
      { path: '', pathMatch: 'full', redirectTo: 'tasks' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EmployeeRoutingModule { }
