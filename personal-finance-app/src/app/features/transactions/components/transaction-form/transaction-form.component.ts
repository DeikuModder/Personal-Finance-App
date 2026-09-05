import { Component, inject, input, output, signal } from '@angular/core';
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
import { toLocalDate } from '../../../../core/utils/date.util';

type TransactionType = 'income' | 'expense' | 'transfer';

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

  transaction = input<Transaction | null>(null);
  saved = output<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>>();
  cancelled = output<void>();

  type = signal<TransactionType>('expense');
  amount = signal(0);
  description = signal('');
  category = signal<TransactionCategory>('other');
  date = signal(new Date());
  accountId = signal('');
  transferFromId = signal('');

  accounts = signal<Account[]>([]);
  incomeCategories = INCOME_CATEGORIES;
  expenseCategories = EXPENSE_CATEGORIES;

  constructor() {
    this.accountService.getAccounts().subscribe((accounts) => {
      this.accounts.set(accounts);
      if (!this.transaction()) {
        this.ensureAccountDefaults();
      }
    });
  }

  ngOnInit(): void {
    const t = this.transaction();
    if (!t) return;
    this.type.set(t.type);
    this.amount.set(t.amount);
    this.description.set(t.description);
    this.category.set(t.category || (t.type === 'transfer' ? 'transfer' : 'other'));
    this.date.set(toLocalDate(t.date));
    this.accountId.set(t.accountId);
    this.transferFromId.set(t.sourceAccountId ?? '');
  }

  get editing(): boolean {
    return this.transaction() !== null;
  }

  get categories() {
    if (this.type() === 'income') return this.incomeCategories;
    if (this.type() === 'expense') return this.expenseCategories;
    return [];
  }

  setType(next: TransactionType): void {
    if (next === this.type()) return;
    this.type.set(next);
    this.category.set(next === 'transfer' ? 'transfer' : 'other');
    if (next === 'transfer') {
      this.ensureAccountDefaults();
    }
  }

  private ensureAccountDefaults(): void {
    const accounts = this.accounts();
    if (accounts.length === 0) return;
    if (!this.accountId()) {
      this.accountId.set(accounts[0].id);
    }
    if (!this.transferFromId()) {
      const other = accounts.find((a) => a.id !== this.accountId());
      this.transferFromId.set((other ?? accounts[0]).id);
    }
  }

  get transferInvalid(): boolean {
    return !this.transferFromId() || !this.accountId() || this.transferFromId() === this.accountId();
  }

  onSubmit(): void {
    if (this.amount() <= 0 || !this.description()) return;
    if (this.type() === 'transfer' && this.transferInvalid) return;

    const payload: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> = {
      type: this.type(),
      amount: this.amount(),
      description: this.description(),
      category: this.category(),
      date: this.date().toISOString().split('T')[0],
      accountId: this.accountId(),
    };
    if (this.type() === 'transfer') {
      payload.sourceAccountId = this.transferFromId();
    }
    this.saved.emit(payload);
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}