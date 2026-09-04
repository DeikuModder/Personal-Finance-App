import { Component, input, output } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Budget } from '../../../../core/models/budget.model';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';

export interface BudgetWithSpend {
  budget: Budget;
  spent: number;
}

@Component({
  selector: 'app-budget-list',
  standalone: true,
  imports: [MatProgressBarModule, MatButtonModule, MatIconModule, CurrencyFormatPipe],
  templateUrl: './budget-list.html',
  styleUrl: './budget-list.scss',
})
export class BudgetListComponent {
  budgets = input<BudgetWithSpend[]>([]);
  deleted = output<string>();

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      food_dining: 'Food & Dining',
      groceries: 'Groceries',
      transport: 'Transport',
      fuel: 'Fuel',
      bills_utilities: 'Bills & Utilities',
      rent_mortgage: 'Rent / Mortgage',
      insurance: 'Insurance',
      entertainment: 'Entertainment',
      subscriptions: 'Subscriptions',
      shopping: 'Shopping',
      health: 'Health',
      education: 'Education',
      personal_care: 'Personal Care',
      investments: 'Investments',
      gifts_sent: 'Gifts Sent',
      other: 'Other',
    };
    return labels[category] || category;
  }

  getProgress(spent: number, amount: number): number {
    if (amount <= 0) return 0;
    return Math.min(100, (spent / amount) * 100);
  }

  getProgressClass(spent: number, amount: number): string {
    const ratio = spent / amount;
    if (ratio >= 1) return 'over';
    if (ratio >= 0.75) return 'warn';
    return 'ok';
  }

  getRemaining(spent: number, amount: number): number {
    return amount - spent;
  }

  abs(value: number): number {
    return Math.abs(value);
  }

  onDelete(id: string, event: Event): void {
    event.stopPropagation();
    this.deleted.emit(id);
  }
}
