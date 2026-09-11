import { Component, input } from '@angular/core';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { PrivacyMaskPipe } from '../../../../shared/pipes/privacy-mask.pipe';
import { PrivacyToggleComponent } from '../../../../shared/components/privacy-toggle/privacy-toggle.component';

@Component({
  selector: 'app-summary-cards',
  standalone: true,
  imports: [CurrencyFormatPipe, PrivacyMaskPipe, PrivacyToggleComponent],
  templateUrl: './summary-cards.html',
  styleUrl: './summary-cards.scss',
})
export class SummaryCardsComponent {
  balance = input(0);
  income = input(0);
  expenses = input(0);
}
