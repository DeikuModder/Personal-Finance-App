import { Component, input, output, inject, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { EffectsService } from '../../services/effects.service';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { PrivacyMaskPipe } from '../../../../shared/pipes/privacy-mask.pipe';

@Component({
  selector: 'app-month-result',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, CurrencyFormatPipe, PrivacyMaskPipe],
  templateUrl: './month-result.html',
  styleUrl: './month-result.scss',
})
export class MonthResultComponent implements OnInit {
  private effects = inject(EffectsService);

  monthlyIncome = input(0);
  totalSpent = input(0);
  savedLost = input(0);
  closed = output<void>();

  ngOnInit(): void {
    if (this.savedLost() > 0) {
      this.effects.goldBurst();
      setTimeout(() => this.effects.celebrate(), 600);
    }
  }

  hasSaved(): boolean {
    return this.savedLost() >= 0;
  }

  abs(value: number): number {
    return Math.abs(value);
  }
}