import { Component, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Budget } from '../../../../core/models/budget.model';
import { TransactionCategory, EXPENSE_CATEGORIES } from '../../../../core/models/category.model';

@Component({
  selector: 'app-budget-form',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  templateUrl: './budget-form.html',
  styleUrl: './budget-form.scss',
})
export class BudgetFormComponent {
  saved = output<Omit<Budget, 'id' | 'createdAt'>>();
  cancelled = output<void>();

  category = signal<TransactionCategory>('food_dining');
  amount = signal(0);

  categories = EXPENSE_CATEGORIES;

  onSubmit(): void {
    if (this.amount() <= 0) return;
    const now = new Date();
    this.saved.emit({
      category: this.category(),
      amount: this.amount(),
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    });
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
