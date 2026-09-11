import { Injectable, signal } from '@angular/core';

const PRIVACY_STORAGE_KEY = 'fintrack_privacy';

export type PrivacySection =
  | 'balance'
  | 'income'
  | 'expenses'
  | 'netWorth'
  | 'transactions'
  | 'accounts'
  | 'budgets'
  | 'goals'
  | 'debts'
  | 'investments'
  | 'wishlist'
  | 'challenge';

interface PrivacyState {
  master: boolean;
  sections: Partial<Record<PrivacySection, boolean>>;
}

function emptyState(): PrivacyState {
  return { master: false, sections: {} };
}

function loadState(): PrivacyState {
  try {
    const raw = localStorage.getItem(PRIVACY_STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<PrivacyState>;
    return {
      master: parsed.master === true,
      sections: parsed.sections && typeof parsed.sections === 'object' ? parsed.sections : {},
    };
  } catch {
    return emptyState();
  }
}

@Injectable({ providedIn: 'root' })
export class PrivacyService {
  private readonly master = signal(false);
  private readonly sections = signal<Partial<Record<PrivacySection, boolean>>>({});

  constructor() {
    const state = loadState();
    this.master.set(state.master);
    this.sections.set(state.sections);
  }

  hiddenFor(section: string): boolean {
    return this.master() || this.sections()[section as PrivacySection] === true;
  }

  masterHidden(): boolean {
    return this.master();
  }

  isSectionHidden(section: string): boolean {
    return this.sections()[section as PrivacySection] === true;
  }

  toggleMaster(): void {
    this.master.update((v) => !v);
    this.persist();
  }

  toggleSection(section: string): void {
    this.sections.update((prev) => ({
      ...prev,
      [section as PrivacySection]: !(prev[section as PrivacySection] === true),
    }));
    this.persist();
  }

  private persist(): void {
    try {
      localStorage.setItem(
        PRIVACY_STORAGE_KEY,
        JSON.stringify({ master: this.master(), sections: this.sections() })
      );
    } catch {
      /* ignore storage errors */
    }
  }
}