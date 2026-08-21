import { ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { firstValueFrom, of } from 'rxjs';
import { User, UserRole, UserStatus } from '../models/auth.models';
import { AuthService } from '../services/auth.service';
import { AuthGuard } from './auth.guard';
import { RoleGuard } from './role.guard';

describe('Authentication and role guards', () => {
  const admin: User = {
    id: 'admin-id',
    fullName: 'Admin',
    email: 'admin@example.com',
    role: UserRole.Admin,
    status: UserStatus.Active
  };
  const employee: User = {
    id: 'employee-id',
    fullName: 'Employee',
    email: 'employee@example.com',
    role: UserRole.Employee,
    status: UserStatus.Active
  };

  it('redirects an anonymous user to login', async () => {
    const { authService, router } = stubs(null);
    const result = await firstValueFrom(new AuthGuard(authService, router).canActivate());

    expect(router.serializeUrl(result as UrlTree)).toBe('/login');
  });

  it('allows an admin to enter an admin route', async () => {
    const { authService, router } = stubs(admin);
    const route = { data: { role: UserRole.Admin } } as unknown as ActivatedRouteSnapshot;

    expect(await firstValueFrom(new RoleGuard(authService, router).canActivate(route))).toBe(true);
  });

  it('denies an employee access to an admin route', async () => {
    const { authService, router } = stubs(employee);
    const route = { data: { role: UserRole.Admin } } as unknown as ActivatedRouteSnapshot;
    const result = await firstValueFrom(new RoleGuard(authService, router).canActivate(route));

    expect(router.serializeUrl(result as UrlTree)).toBe('/employee/tasks');
  });

  it('allows an employee to enter an employee route', async () => {
    const { authService, router } = stubs(employee);
    const route = { data: { role: UserRole.Employee } } as unknown as ActivatedRouteSnapshot;

    expect(await firstValueFrom(new RoleGuard(authService, router).canActivate(route))).toBe(true);
  });

  function stubs(user: User | null): { authService: AuthService; router: Router } {
    const authService = {
      validateCurrentSession: () => of(user)
    } as unknown as AuthService;
    const router = {
      createUrlTree: (commands: string[]) => ({ commands }) as unknown as UrlTree,
      serializeUrl: (tree: UrlTree) => `/${(tree as unknown as { commands: string[] }).commands
        .map(command => command.replace(/^\//, ''))
        .join('/')}`
    } as unknown as Router;
    return { authService, router };
  }
});
