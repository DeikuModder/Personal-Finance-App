import { Component, input } from '@angular/core';
import { Transaction } from '../../../../core/models/transaction.model';
import { WeekBucket } from '../../services/challenge.service';
import { toLocalDate } from '../../../../core/utils/date.util';

interface DayChip {
  day: number;
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
  year = input(0);
  month = input(0);
  bucket = input<WeekBucket | null>(null);
  cap = input(0);

  get days(): DayChip[] {
    const bucket = this.bucket();
    if (!bucket) return [];
    const target = bucket.dayEnd - bucket.dayStart + 1;
    const daily = target > 0 ? this.cap() / target : 0;

    const chips: DayChip[] = [];
    for (let day = bucket.dayStart; day <= bucket.dayEnd; day++) {
      const spent = this.transactions()
        .filter((t) => {
          if (t.type !== 'expense') return false;
          const d = toLocalDate(t.date);
          return (
            d.getFullYear() === this.year() &&
            d.getMonth() === this.month() &&
            d.getDate() === day
          );
        })
        .reduce((sum, t) => sum + t.amount, 0);
      chips.push({ day, spent, target: daily, over: spent > daily });
    }
    return chips;
  }

  get todayIsInBucket(): boolean {
    const bucket = this.bucket();
    if (!bucket) return false;
    const now = new Date();
    if (now.getFullYear() !== this.year() || now.getMonth() !== this.month()) return false;
    return now.getDate() >= bucket.dayStart && now.getDate() <= bucket.dayEnd;
  }
}