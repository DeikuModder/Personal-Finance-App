import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Transaction } from '../../../../core/models/transaction.model';
import { WeekStatus } from '../../services/challenge.service';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { PrivacyMaskPipe } from '../../../../shared/pipes/privacy-mask.pipe';
import { WeekGaugeComponent } from '../charts/week-gauge/week-gauge.component';
import { DayStripeComponent } from '../day-stripe/day-stripe.component';

@Component({
  selector: 'app-week-card',
  standalone: true,
  imports: [MatIconModule, CurrencyFormatPipe, PrivacyMaskPipe, WeekGaugeComponent, DayStripeComponent],
  templateUrl: './week-card.html',
  styleUrl: './week-card.scss',
})
export class WeekCardComponent {
  week = input<WeekStatus | null>(null);
  current = input(false);
  transactions = input<Transaction[]>([]);
  startDate = input<Date | null>(null);

  abs(value: number): number {
    return Math.abs(value);
  }

  formatRange(start: Date, end: Date): string {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    if (start.getFullYear() !== end.getFullYear()) {
      options.year = 'numeric';
    }
    const fmt = (d: Date) => d.toLocaleDateString('en-US', options);
    return `${fmt(start)} – ${fmt(end)}`;
  }
}