import { Component, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { Transaction } from '../../../../core/models/transaction.model';
import { TransactionCategory, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../../../../core/models/category.model';
import { Account } from '../../../../core/models/account.model';
import { AccountService } from '../../../accounts/services/account.service';

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
  ],
  templateUrl: './transaction-form.html',
  styleUrl: './transaction-form.scss',
})
export class TransactionFormComponent {
  private accountService = inject(AccountService);

  saved = output<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>>();
  cancelled = output<void>();

  type = signal<'income' | 'expense'>('expense');
  amount = signal(0);
  description = signal('');
  category = signal<TransactionCategory>('other');
  date = signal(new Date());
  accountId = signal('');

  accounts = signal<Account[]>([]);
  incomeCategories = INCOME_CATEGORIES;
  expenseCategories = EXPENSE_CATEGORIES;

  constructor() {
    this.accountService.getAccounts().subscribe((accounts) => {
      this.accounts.set(accounts);
      if (accounts.length > 0 && !this.accountId()) {
        this.accountId.set(accounts[0].id);
      }
    });
  }

  get categories() {
    return this.type() === 'income' ? this.incomeCategories : this.expenseCategories;
  }

  toggleType(): void {
    this.type.update((t) => (t === 'income' ? 'expense' : 'income'));
    this.category.set('other');
  }

  onSubmit(): void {
    if (this.amount() <= 0 || !this.description()) return;

    this.saved.emit({
      type: this.type(),
      amount: this.amount(),
      description: this.description(),
      category: this.category(),
      date: this.date().toISOString().split('T')[0],
      accountId: this.accountId(),
    });
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
