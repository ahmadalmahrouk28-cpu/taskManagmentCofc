import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, map } from 'rxjs';
import { UserRole } from '../models/auth.models';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) { }

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
    const requiredRole = route.data['role'] as UserRole;

    return this.authService.validateCurrentSession().pipe(
      map(user => {
        if (user?.role === requiredRole) {
          return true;
        }

        return user
          ? this.router.createUrlTree([
              user.role === UserRole.Admin ? '/admin/dashboard' : '/employee/tasks'
            ])
          : this.router.createUrlTree(['/login']);
      })
    );
  }
}
