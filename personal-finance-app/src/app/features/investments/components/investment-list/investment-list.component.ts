import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Investment } from '../../../../core/models/investment.model';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';

@Component({
  selector: 'app-investment-list',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, CurrencyFormatPipe],
  templateUrl: './investment-list.html',
  styleUrl: './investment-list.scss',
})
export class InvestmentListComponent {
  investments = input<Investment[]>([]);
  deleted = output<string>();

  getValue(investment: Investment): number {
    const shares = investment.shares ?? 1;
    return investment.currentPrice * shares;
  }

  getAnnualIncome(investment: Investment): number {
    if (!investment.dividendPerShare) return 0;
    const shares = investment.shares ?? 1;
    return investment.dividendPerShare * shares;
  }

  getMonthlyIncome(investment: Investment): number {
    return this.getAnnualIncome(investment) / 12;
  }

  getYield(investment: Investment): number {
    if (!investment.dividendPerShare || investment.currentPrice <= 0) return 0;
    return (investment.dividendPerShare / investment.currentPrice) * 100;
  }

  hasIncome(investment: Investment): boolean {
    return !!investment.dividendPerShare && investment.dividendPerShare > 0;
  }

  onDelete(id: string, event: Event): void {
    event.stopPropagation();
    this.deleted.emit(id);
  }
}