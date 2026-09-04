import { Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';
import { Budget } from '../../core/models/budget.model';
import { Transaction } from '../../core/models/transaction.model';
import { BudgetService } from './services/budget.service';
import { TransactionService } from '../transactions/services/transaction.service';
import { BudgetFormComponent } from './components/budget-form/budget-form.component';
import { BudgetListComponent, BudgetWithSpend } from './components/budget-list/budget-list.component';

@Component({
  selector: 'app-budgets',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatProgressBarModule, CurrencyFormatPipe, BudgetFormComponent, BudgetListComponent],
  templateUrl: './budgets.html',
  styleUrl: './budgets.scss',
})
export class BudgetsComponent {
  private budgetService = inject(BudgetService);
  private transactionService = inject(TransactionService);

  budgets = signal<BudgetWithSpend[]>([]);
  showForm = signal(false);
  currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  constructor() {
    const now = new Date();

    this.budgetService.getBudgetsForMonth(now.getFullYear(), now.getMonth() + 1).subscribe((budgets) => {
      this.transactionService.getTransactions().subscribe((transactions) => {
        const monthTransactions = transactions.filter((t) => {
          const date = new Date(t.date);
          return (
            t.type === 'expense' &&
            date.getFullYear() === now.getFullYear() &&
            date.getMonth() === now.getMonth()
          );
        });

        const withSpend: BudgetWithSpend[] = budgets.map((budget) => ({
          budget,
          spent: monthTransactions
            .filter((t) => t.category === budget.category)
            .reduce((sum, t) => sum + t.amount, 0),
        }));

        this.budgets.set(withSpend);
      });
    });
  }

  getTotalBudget(): number {
    return this.budgets().reduce((sum, item) => sum + item.budget.amount, 0);
  }

  getTotalSpent(): number {
    return this.budgets().reduce((sum, item) => sum + item.spent, 0);
  }

  addBudget(data: Omit<Budget, 'id' | 'createdAt'>): void {
    this.budgetService.addBudget(data).subscribe(() => {
      this.showForm.set(false);
      window.location.reload();
    });
  }

  onDelete(id: string): void {
    this.budgetService.deleteBudget(id).subscribe(() => {
      window.location.reload();
    });
  }

  onCancel(): void {
    this.showForm.set(false);
  }
}
