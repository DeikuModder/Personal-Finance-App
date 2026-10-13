import { Injectable, signal } from '@angular/core';

export interface ThemeOption {
  id: string;
  label: string;
  accent: string;
  deep: string;
  bg: string;
}

const THEME_KEY = 'fintrack_theme';

const DEFAULT_THEME = 'red';

const THEMES: ThemeOption[] = [
  { id: 'red', label: 'Red', accent: '#ff6e6e', deep: '#d62020', bg: '#121212' },
  { id: 'blue', label: 'Blue', accent: '#64b5f6', deep: '#1e6fd9', bg: '#14161c' },
  { id: 'cyan', label: 'Cyan', accent: '#4dd0e1', deep: '#00838f', bg: '#121a1c' },
  { id: 'violet', label: 'Violet', accent: '#b39ddb', deep: '#6a1b9a', bg: '#15121d' },
  { id: 'rose', label: 'Rose', accent: '#f48fb1', deep: '#ad1457', bg: '#1a1316' },
];

function sanitize(id: string | null): string {
  return id && THEMES.some((t) => t.id === id) ? id : DEFAULT_THEME;
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly themes = THEMES;
  readonly current = signal<ThemeOption>(this.resolveCurrent());

  constructor() {
    // Safety net: re-apply the resolved theme at bootstrap in case the
    // pre-paint script in index.html didn't run (blocked or a stale cached
    // document). Always normalize so the DOM matches `current`.
    this.applyTheme(this.current(), false);
  }

  private applyTheme(theme: ThemeOption, persist: boolean): void {
    // Apply to the DOM first so switching works even if storage is unavailable
    // (private mode, quota exceeded, disabled storage).
    try {
      const root = document.documentElement;
      root.classList.remove(...THEMES.map((t) => `theme-${t.id}`));
      if (theme.id !== DEFAULT_THEME) {
        root.classList.add(`theme-${theme.id}`);
      }
    } catch {
      /* no DOM */
    }
    this.applyThemeColor(theme);
    if (persist) {
      try {
        window.localStorage.setItem(THEME_KEY, theme.id);
      } catch {
        /* storage unavailable: theme still applies for this session */
      }
    }
  }

  private applyThemeColor(theme: ThemeOption): void {
    try {
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', theme.bg);
    } catch {
      /* no DOM */
    }
  }

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
    this.applyTheme(theme, true);
  }
}