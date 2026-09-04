import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Transaction } from '../../../../core/models/transaction.model';
import { WeekStatus } from '../../services/challenge.service';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { WeekGaugeComponent } from '../charts/week-gauge/week-gauge.component';
import { DayStripeComponent } from '../day-stripe/day-stripe.component';

@Component({
  selector: 'app-week-card',
  standalone: true,
  imports: [MatIconModule, CurrencyFormatPipe, WeekGaugeComponent, DayStripeComponent],
  templateUrl: './week-card.html',
  styleUrl: './week-card.scss',
})
export class WeekCardComponent {
  week = input<WeekStatus | null>(null);
  current = input(false);
  year = input(0);
  month = input(0);
  transactions = input<Transaction[]>([]);

  abs(value: number): number {
    return Math.abs(value);
  }
}