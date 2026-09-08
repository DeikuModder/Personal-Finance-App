import { Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Budget, BudgetItem } from '../../../../core/models/budget.model';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { CategoryService } from '../../../../core/services/category.service';

export interface BudgetWithSpend {
  budget: Budget;
  items: BudgetItem[];
  spent: number;
  amount: number;
}

export interface NewBudgetItem {
  budgetId: string;
  name: string;
  price: number;
}

@Component({
  selector: 'app-budget-list',
  standalone: true,
  imports: [
    FormsModule,
    MatProgressBarModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    CurrencyFormatPipe,
  ],
  templateUrl: './budget-list.html',
  styleUrl: './budget-list.scss',
})
export class BudgetListComponent {
  private categoryService = inject(CategoryService);

  budgets = input<BudgetWithSpend[]>([]);
  deleted = output<string>();
  itemAdded = output<NewBudgetItem>();
  itemDeleted = output<string>();

  private itemForms = new Map<string, { name: string; price: number }>();

  itemForm(budgetId: string): { name: string; price: number } {
    if (!this.itemForms.has(budgetId)) {
      this.itemForms.set(budgetId, { name: '', price: 0 });
    }
    return this.itemForms.get(budgetId)!;
  }

  getCategoryLabel(category: string): string {
    return this.categoryService.getLabel(category);
  }

  addItem(budgetId: string, form: { name: string; price: number }): void {
    const name = form.name.trim();
    const price = Number(form.price);
    if (!name || price <= 0) return;
    this.itemAdded.emit({ budgetId, name, price });
    form.name = '';
    form.price = 0;
  }

  getProgress(spent: number, amount: number): number {
    if (amount <= 0) return 0;
    return Math.min(100, (spent / amount) * 100);
  }

  getProgressClass(spent: number, amount: number): string {
    if (amount <= 0) return 'ok';
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

  onDeleteItem(id: string, event: Event): void {
    event.stopPropagation();
    this.itemDeleted.emit(id);
  }
}
