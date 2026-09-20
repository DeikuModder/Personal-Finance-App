import { Injectable, signal } from '@angular/core';

export interface ThemeOption {
  id: string;
  label: string;
  accent: string;
  deep: string;
}

const THEME_KEY = 'fintrack_theme';

const DEFAULT_THEME = 'red';

const THEMES: ThemeOption[] = [
  { id: 'red', label: 'Red', accent: '#ff6e6e', deep: '#d62020' },
  { id: 'blue', label: 'Blue', accent: '#64b5f6', deep: '#1e6fd9' },
  { id: 'cyan', label: 'Cyan', accent: '#4dd0e1', deep: '#00838f' },
  { id: 'violet', label: 'Violet', accent: '#b39ddb', deep: '#6a1b9a' },
  { id: 'rose', label: 'Rose', accent: '#f48fb1', deep: '#ad1457' },
];

function sanitize(id: string | null): string {
  return id && THEMES.some((t) => t.id === id) ? id : DEFAULT_THEME;
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly themes = THEMES;
  readonly current = signal<ThemeOption>(this.resolveCurrent());

  private resolveCurrent(): ThemeOption {
    let id: string | null = null;
    try {
      if (typeof document !== 'undefined') {
        for (const t of THEMES) {
          if (document.documentElement.classList.contains(`theme-${t.id}`)) {
            id = t.id;
            break;
          }
        }
      }
      if (!id) {
        id = window.localStorage.getItem(THEME_KEY);
      }
    } catch {
      /* no DOM / no localStorage */
    }
    return THEMES.filter((t) => t.id === sanitize(id))[0];
  }

  select(themeId: string): void {
    const theme = THEMES.find((t) => t.id === themeId);
    if (!theme) return;
    this.current.set(theme);
    try {
      window.localStorage.setItem(THEME_KEY, theme.id);
      document.documentElement.classList.remove(...THEMES.map((t) => `theme-${t.id}`));
      if (theme.id !== DEFAULT_THEME) {
        document.documentElement.classList.add(`theme-${theme.id}`);
      }
    } catch {
      /* ignore */
    }
  }
}