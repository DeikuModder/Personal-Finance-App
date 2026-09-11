import { Component, inject, input, output, signal } from '@angular/core';
import { Transaction } from '../../../../core/models/transaction.model';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { PrivacyMaskPipe } from '../../../../shared/pipes/privacy-mask.pipe';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { toLocalDate } from '../../../../core/utils/date.util';
import { AccountService } from '../../../accounts/services/account.service';
import { CategoryService } from '../../../../core/services/category.service';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [CurrencyFormatPipe, PrivacyMaskPipe, MatIconModule, MatButtonModule],
  templateUrl: './transaction-list.html',
  styleUrl: './transaction-list.scss',
})
export class TransactionListComponent {
  private accountService = inject(AccountService);
  private categoryService = inject(CategoryService);

  transactions = input<Transaction[]>([]);
  deleted = output<string>();
  edited = output<string>();

  accountNames = signal<Record<string, string>>({});

  constructor() {
    this.accountService.getAccounts().subscribe((accounts) => {
      const map: Record<string, string> = {};
      for (const account of accounts) {
        map[account.id] = account.name;
      }
      this.accountNames.set(map);
    });
  }

  getCategoryIcon(transaction: Transaction): string {
    if (transaction.type === 'transfer') return 'swap_horiz';
    return this.categoryService.getIcon(transaction.category);
  }

  accountName(id: string | undefined): string {
    if (!id) return '';
    return this.accountNames()[id] ?? id.slice(0, 8);
  }

  isTransfer(transaction: Transaction): boolean {
    return transaction.type === 'transfer';
  }

  signFor(transaction: Transaction): string {
    if (transaction.type === 'income') return '+';
    if (transaction.type === 'expense') return '-';
    return '';
  }

  formatDate(dateStr: string): string {
    return toLocalDate(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  onDelete(id: string, event: Event): void {
    event.stopPropagation();
    this.deleted.emit(id);
  }

  onEdit(id: string, event: Event): void {
    event.stopPropagation();
    this.edited.emit(id);
  }
}