import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'task-management-theme';
  readonly theme = signal<ThemeMode>('light');

  constructor(@Inject(DOCUMENT) private readonly document: Document) {
    const savedTheme = this.readSavedTheme();
    const preferredTheme: ThemeMode = savedTheme
      ?? (globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    this.setTheme(preferredTheme);
  }

  toggle(): void {
    this.setTheme(this.theme() === 'dark' ? 'light' : 'dark');
  }

  private setTheme(theme: ThemeMode): void {
    this.theme.set(theme);
    this.document.documentElement.setAttribute('data-bs-theme', theme);
    this.document.documentElement.style.colorScheme = theme;

    try {
      globalThis.localStorage?.setItem(this.storageKey, theme);
    } catch {
      // يستمر الثيم الحالي حتى عندما يمنع المتصفح التخزين المحلي.
    }
  }

  private readSavedTheme(): ThemeMode | null {
    try {
      const value = globalThis.localStorage?.getItem(this.storageKey);
      return value === 'light' || value === 'dark' ? value : null;
    } catch {
      return null;
    }
  }
}
