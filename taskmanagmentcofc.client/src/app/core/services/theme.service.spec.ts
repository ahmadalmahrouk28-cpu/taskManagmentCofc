import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.removeItem('task-management-theme');
    TestBed.configureTestingModule({});
  });

  afterEach(() => localStorage.removeItem('task-management-theme'));

  it('toggles the document theme and saves the preference', () => {
    const service = TestBed.inject(ThemeService);
    const document = TestBed.inject(DOCUMENT);
    const initialTheme = service.theme();
    const expectedTheme = initialTheme === 'dark' ? 'light' : 'dark';

    service.toggle();

    expect(service.theme()).toBe(expectedTheme);
    expect(document.documentElement.getAttribute('data-bs-theme')).toBe(expectedTheme);
    expect(localStorage.getItem('task-management-theme')).toBe(expectedTheme);
  });
});
