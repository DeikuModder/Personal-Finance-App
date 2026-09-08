import { Component, inject, signal } from '@angular/core';
import { combineLatest } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';
import { Budget } from '../../core/models/budget.model';
import { BudgetService } from './services/budget.service';
import { TransactionService } from '../transactions/services/transaction.service';
import { BudgetFormComponent } from './components/budget-form/budget-form.component';
import { toLocalDate } from '../../core/utils/date.util';
import { BudgetListComponent, BudgetWithSpend, NewBudgetItem } from './components/budget-list/budget-list.component';
import { SectionHelpComponent } from '../../shared/components/section-help/section-help';

@Component({
  selector: 'app-budgets',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatProgressBarModule, CurrencyFormatPipe, BudgetFormComponent, BudgetListComponent, SectionHelpComponent],
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

    combineLatest([
      this.budgetService.getBudgetsForMonth(now.getFullYear(), now.getMonth() + 1),
      this.budgetService.getItems(),
      this.transactionService.getTransactions(),
    ]).subscribe(([budgets, items, transactions]) => {
      const monthTransactions = transactions.filter((t) => {
        const date = toLocalDate(t.date);
        return (
          t.type === 'expense' &&
          date.getFullYear() === now.getFullYear() &&
          date.getMonth() === now.getMonth()
        );
      });

      const withSpend: BudgetWithSpend[] = budgets.map((budget) => {
        const budgetItems = items.filter((item) => item.budgetId === budget.id);
        return {
          budget,
          items: budgetItems,
          amount: this.budgetService.getBudgetAmount(budget, items),
          spent: monthTransactions
            .filter((t) => t.category === budget.category)
            .reduce((sum, t) => sum + t.amount, 0),
        };
      });

      this.budgets.set(withSpend);
    });
  }

  getTotalBudget(): number {
    return this.budgets().reduce((sum, item) => sum + item.amount, 0);
  }

  getTotalSpent(): number {
    return this.budgets().reduce((sum, item) => sum + item.spent, 0);
  }

  getTotalRemaining(): number {
    return this.getTotalBudget() - this.getTotalSpent();
  }

  addBudget(data: Omit<Budget, 'id' | 'createdAt'>): void {
    this.budgetService.addBudget(data).subscribe(() => {
      this.showForm.set(false);
    });
  }

  onDelete(id: string): void {
    this.budgetService.deleteBudget(id).subscribe();
  }

  onItemAdded(item: NewBudgetItem): void {
    this.budgetService
      .addItem({
        budgetId: item.budgetId,
        name: item.name,
        price: item.price,
      })
      .subscribe();
  }

  onItemDeleted(id: string): void {
    this.budgetService.deleteItem(id).subscribe();
  }

  onCancel(): void {
    this.showForm.set(false);
  }
}