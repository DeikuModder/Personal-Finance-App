import { Component, input } from '@angular/core';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';

@Component({
  selector: 'app-summary-cards',
  standalone: true,
  imports: [CurrencyFormatPipe],
  templateUrl: './summary-cards.html',
  styleUrl: './summary-cards.scss',
})
export class SummaryCardsComponent {
  balance = input(0);
  income = input(0);
  expenses = input(0);
}
