import { Component } from '@angular/core';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: false,
  template: `
    <button type="button" class="theme-toggle" (click)="themeService.toggle()"
            [attr.aria-label]="themeService.theme() === 'dark' ? 'تفعيل الثيم الفاتح' : 'تفعيل الثيم الداكن'"
            [attr.title]="themeService.theme() === 'dark' ? 'الثيم الفاتح' : 'الثيم الداكن'">
      <span class="theme-toggle-track" aria-hidden="true">
        <span class="theme-toggle-thumb" [class.is-dark]="themeService.theme() === 'dark'">
          <i *ngIf="themeService.theme() === 'light'" class="bi bi-sun-fill"></i>
          <i *ngIf="themeService.theme() === 'dark'" class="bi bi-moon-stars-fill"></i>
        </span>
      </span>
    </button>
  `
})
export class ThemeToggleComponent {
  constructor(readonly themeService: ThemeService) { }
}
