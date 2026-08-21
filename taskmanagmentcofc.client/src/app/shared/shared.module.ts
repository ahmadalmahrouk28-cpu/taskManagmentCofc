import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AppNavbarComponent } from './components/app-navbar/app-navbar.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { NotificationMenuComponent } from './components/notification-menu/notification-menu.component';
import { ThemeToggleComponent } from './components/theme-toggle/theme-toggle.component';
import { TaskStatusLabelPipe } from './pipes/task-status-label.pipe';
import { UserRoleLabelPipe } from './pipes/user-role-label.pipe';
import { UserStatusLabelPipe } from './pipes/user-status-label.pipe';

@NgModule({
  declarations: [
    AppNavbarComponent,
    NotFoundComponent,
    NotificationMenuComponent,
    ThemeToggleComponent,
    TaskStatusLabelPipe,
    UserRoleLabelPipe,
    UserStatusLabelPipe
  ],
  imports: [CommonModule, RouterModule],
  exports: [
    AppNavbarComponent,
    NotFoundComponent,
    NotificationMenuComponent,
    ThemeToggleComponent,
    TaskStatusLabelPipe,
    UserRoleLabelPipe,
    UserStatusLabelPipe
  ]
})
export class SharedModule { }
