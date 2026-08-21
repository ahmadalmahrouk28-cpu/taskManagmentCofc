import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';
import { UserRole } from './core/models/auth.models';
import { NotFoundComponent } from './shared/components/not-found/not-found.component';

const routes: Routes = [
  {
    path: 'admin',
    canActivate: [AuthGuard, RoleGuard],
    data: { role: UserRole.Admin },
    loadChildren: () => import('./features/admin/admin.module').then(module => module.AdminModule)
  },
  {
    path: 'employee',
    canActivate: [AuthGuard, RoleGuard],
    data: { role: UserRole.Employee },
    loadChildren: () => import('./features/employee/employee.module').then(module => module.EmployeeModule)
  },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: '**', component: NotFoundComponent, title: 'الصفحة غير موجودة' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
