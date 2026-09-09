import { Injectable, inject, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Debt } from '../../../core/models/debt.model';
import { DebtService } from './debt.service';
import { toLocalDate } from '../../../core/utils/date.util';

export const REMINDER_DAYS = 7;
const ENABLED_KEY = 'fintrack_debt_reminders';
const NOTIFIED_KEY = 'fintrack_debt_notified';

export interface DebtReminder {
  debt: Debt;
  kind: 'overdue' | 'due';
  date: string;
  key: string;
}

@Injectable({ providedIn: 'root' })
export class DebtReminderService {
  private debtService = inject(DebtService);

  private banner$ = new BehaviorSubject<DebtReminder[]>([]);
  private overdueCount = signal(0);
  private dueCount = signal(0);
  private enabled = this.loadEnabled();

  constructor() {
    this.debtService.getDebts().subscribe((debts) => {
      const reminders = this.computeReminders(debts);
      this.banner$.next(reminders);
      this.overdueCount.set(reminders.filter((r) => r.kind === 'overdue').length);
      this.dueCount.set(reminders.filter((r) => r.kind === 'due').length);
      this.notifyUnseen(reminders);
      this.pruneNotified(debts);
    });
  }

  getBanner() {
    return this.banner$.asObservable();
  }

  getOverdueCount(): number {
    return this.overdueCount();
  }

  getDueCount(): number {
    return this.dueCount();
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(enable: boolean): void {
    this.enabled = enable;
    localStorage.setItem(ENABLED_KEY, enable ? '1' : '0');
    if (enable && typeof Notification !== 'undefined') {
      Notification.requestPermission().catch(() => undefined);
    }
  }

  dismiss(id: string): void {
    const reminders = this.banner$.value.filter((r) => r.debt.id !== id);
    this.banner$.next(reminders);
    this.overdueCount.set(reminders.filter((r) => r.kind === 'overdue').length);
    this.dueCount.set(reminders.filter((r) => r.kind === 'due').length);
    this.markSeenAll(id);
  }

  private computeReminders(debts: Debt[]): DebtReminder[] {
    const today = startOfDay(new Date());
    const horizon = new Date(today);
    horizon.setDate(horizon.getDate() + REMINDER_DAYS);

    const reminders: DebtReminder[] = [];
    for (const debt of debts) {
      if (debt.status !== 'active') continue;
      const effective = debt.remindOn ?? debt.dueDate;
      if (!effective) continue;
      const date = startOfDay(toLocalDate(effective));
      if (date.getTime() < today.getTime()) {
        reminders.push({ debt, kind: 'overdue', date: effective, key: `${debt.id}:${effective}` });
      } else if (date.getTime() <= horizon.getTime()) {
        reminders.push({ debt, kind: 'due', date: effective, key: `${debt.id}:${effective}` });
      }
    }

    reminders.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'overdue' ? -1 : 1;
      return a.date.localeCompare(b.date);
    });
    return reminders;
  }

  private notifyUnseen(reminders: DebtReminder[]): void {
    if (!this.enabled) return;
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') return;
    if (reminders.length === 0) return;

    const notified = this.loadNotified();
    for (const reminder of reminders) {
      if (notified[reminder.key]) continue;
      notified[reminder.key] = true;
      const title = reminder.kind === 'overdue' ? 'Debt overdue' : 'Debt reminder';
      const body =
        reminder.kind === 'overdue'
          ? `${reminder.debt.creditor}: payment was due on ${reminder.date}`
          : `${reminder.debt.creditor}: payment due on ${reminder.date}`;
      try {
        new Notification(title, { body });
      } catch {
        // ignore
      }
    }
    localStorage.setItem(NOTIFIED_KEY, JSON.stringify(notified));
  }

  private markSeenAll(debtId: string): void {
    const notified = this.loadNotified();
    let changed = false;
    for (const key of Object.keys(notified)) {
      if (key.startsWith(debtId + ':')) {
        delete notified[key];
        changed = true;
      }
    }
    if (changed) localStorage.setItem(NOTIFIED_KEY, JSON.stringify(notified));
  }

  private pruneNotified(debts: Debt[]): void {
    const notified = this.loadNotified();
    const ids = new Set(debts.map((d) => d.id));
    let changed = false;
    for (const key of Object.keys(notified)) {
      const id = key.split(':')[0];
      if (!ids.has(id)) {
        delete notified[key];
        changed = true;
      }
    }
    if (changed) localStorage.setItem(NOTIFIED_KEY, JSON.stringify(notified));
  }

  private loadEnabled(): boolean {
    return localStorage.getItem(ENABLED_KEY) === '1';
  }

  private loadNotified(): Record<string, boolean> {
    try {
      return JSON.parse(localStorage.getItem(NOTIFIED_KEY) || '{}') as Record<string, boolean>;
    } catch {
      return {};
    }
  }
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}