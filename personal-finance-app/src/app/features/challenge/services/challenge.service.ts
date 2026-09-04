import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ChallengeConfig } from '../../../core/models/challenge.model';
import { Transaction } from '../../../core/models/transaction.model';

export interface WeekBucket {
  index: number;
  dayStart: number;
  dayEnd: number;
  label: string;
}

export interface WeekStatus {
  bucket: WeekBucket;
  cap: number;
  spent: number;
  remaining: number;
  status: 'over' | 'ok' | 'good';
  carry: number;
}

export interface MonthStats {
  totalSpent: number;
  savedLost: number;
  cumulative: number[];
}

@Injectable({ providedIn: 'root' })
export class ChallengeService {
  constructor(private readonly http: HttpClient) {}

  getConfig(): Observable<ChallengeConfig> {
    return this.http
      .get<ChallengeConfig>('/api/challenge-config')
      .pipe(map((cfg) => cfg ?? { monthlyIncome: 0, weeklyMax: 0, enabled: false, createdAt: '' }));
  }

  setConfig(config: ChallengeConfig): Observable<ChallengeConfig> {
    return this.http.put<ChallengeConfig>('/api/challenge-config', config);
  }

  clearConfig(): void {
    // No-op: config is stored in the cloud; clearing is handled by reset in the UI.
  }

  getWeekBuckets(year: number, month: number): WeekBucket[] {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const buckets: WeekBucket[] = [];
    let dayStart = 1;
    let index = 1;

    while (dayStart <= daysInMonth) {
      const dayEnd = Math.min(dayStart + 6, daysInMonth);
      buckets.push({
        index,
        dayStart,
        dayEnd,
        label: `W${index}`,
      });
      dayStart = dayEnd + 1;
      index++;
    }
    return buckets;
  }

  getSpentForBucket(transactions: Transaction[], year: number, month: number, bucket: WeekBucket): number {
    return transactions
      .filter((t) => {
        if (t.type !== 'expense') return false;
        const d = new Date(t.date);
        return (
          d.getFullYear() === year &&
          d.getMonth() === month &&
          d.getDate() >= bucket.dayStart &&
          d.getDate() <= bucket.dayEnd
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }

  getAllSpent(transactions: Transaction[], year: number, month: number): number[] {
    return this.getWeekBuckets(year, month).map((bucket) =>
      this.getSpentForBucket(transactions, year, month, bucket)
    );
  }

  computeWeeks(config: ChallengeConfig, spent: number[], year: number, month: number): WeekStatus[] {
    const buckets = this.getWeekBuckets(year, month);
    let carry = 0;

    return buckets.map((bucket, i) => {
      const cap = config.weeklyMax + carry;
      const weekSpent = spent[i] ?? 0;
      const remaining = cap - weekSpent;
      carry = remaining;
      const status = remaining < 0 ? 'over' : remaining <= config.weeklyMax * 0.25 ? 'ok' : 'good';
      return { bucket, cap, spent: weekSpent, remaining, status, carry };
    });
  }

  getMonthStats(config: ChallengeConfig, spent: number[]): MonthStats {
    const totalSpent = spent.reduce((sum, s) => sum + s, 0);
    const savedLost = config.monthlyIncome - totalSpent;
    let running = 0;
    const cumulative = spent.map((s) => {
      running += config.weeklyMax - s;
      return Math.round(running * 100) / 100;
    });
    return { totalSpent, savedLost, cumulative };
  }
}