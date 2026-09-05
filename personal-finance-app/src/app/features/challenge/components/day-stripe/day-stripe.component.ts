import { Component, input } from '@angular/core';
import { Transaction } from '../../../../core/models/transaction.model';
import { WeekBucket } from '../../services/challenge.service';
import { toLocalDate, dateKey, addDays } from '../../../../core/utils/date.util';

interface DayChip {
  day: number;
  date: Date;
  marked: boolean;
  spent: number;
  target: number;
  over: boolean;
}

@Component({
  selector: 'app-day-stripe',
  standalone: true,
  templateUrl: './day-stripe.html',
  styleUrl: './day-stripe.scss',
})
export class DayStripeComponent {
  transactions = input<Transaction[]>([]);
  bucket = input<WeekBucket | null>(null);
  cap = input(0);
  startDate = input<Date | null>(null);

  get days(): DayChip[] {
    const bucket = this.bucket();
    if (!bucket) return [];

    const todayKey = dateKey(new Date());
    const start = this.startDate();
    const startKey = start ? dateKey(start) : null;

    const chips: DayChip[] = [];
    let cursor = new Date(bucket.startDate);
    while (cursor.getTime() <= bucket.endDate.getTime()) {
      const key = dateKey(cursor);
      const marked = !!startKey && key >= startKey && key <= todayKey;
      const spent = this.spentOn(cursor);
      chips.push({ day: cursor.getDate(), date: new Date(cursor), marked, spent, target: 0, over: false });
      cursor = addDays(cursor, 1);
    }

    const markedCount = chips.filter((c) => c.marked).length;
    const daily = markedCount > 0 ? this.cap() / markedCount : 0;

    for (const chip of chips) {
      if (chip.marked) {
        chip.target = daily;
        chip.over = chip.spent > daily;
      }
    }

    return chips;
  }

  get todayIsInBucket(): boolean {
    const bucket = this.bucket();
    if (!bucket) return false;
    const todayKey = dateKey(new Date());
    return todayKey >= dateKey(bucket.startDate) && todayKey <= dateKey(bucket.endDate);
  }

  formatDate(day: DayChip): string {
    return day.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  private spentOn(date: Date): number {
    const key = dateKey(date);
    return this.transactions()
      .filter((t) => {
        if (t.type !== 'expense') return false;
        return dateKey(toLocalDate(t.date)) === key;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }
}