import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ChallengeConfig } from '../../../core/models/challenge.model';
import { Transaction } from '../../../core/models/transaction.model';
import { toLocalDate, startOfWeek, addDays, dateKey } from '../../../core/utils/date.util';

export interface WeekBucket {
  index: number;
  startDate: Date;
  endDate: Date;
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
    const firstOfMonth = new Date(year, month, 1);
    const lastOfMonth = new Date(year, month + 1, 0);
    const buckets: WeekBucket[] = [];
    let cursor = startOfWeek(firstOfMonth);
    let index = 1;

    while (cursor.getTime() <= lastOfMonth.getTime()) {
      const end = addDays(cursor, 6);
      buckets.push({
        index,
        startDate: cursor,
        endDate: end,
        label: `W${index}`,
      });
      cursor = addDays(end, 1);
      index++;
    }
    return buckets;
  }

  getSpentForBucket(transactions: Transaction[], bucket: WeekBucket): number {
    const startKey = dateKey(bucket.startDate);
    const endKey = dateKey(bucket.endDate);
    return transactions
      .filter((t) => {
        if (t.type !== 'expense') return false;
        const key = dateKey(toLocalDate(t.date));
        return key >= startKey && key <= endKey;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }

  getAllSpent(transactions: Transaction[], year: number, month: number): number[] {
    return this.getWeekBuckets(year, month).map((bucket) =>
      this.getSpentForBucket(transactions, bucket)
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