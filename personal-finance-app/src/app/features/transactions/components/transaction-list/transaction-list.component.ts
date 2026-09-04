import { Component, input, output } from '@angular/core';
import { Transaction } from '../../../../core/models/transaction.model';
import { CATEGORY_ICONS } from '../../../../core/models/category.model';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [CurrencyFormatPipe, MatIconModule, MatButtonModule],
  templateUrl: './transaction-list.html',
  styleUrl: './transaction-list.scss',
})
export class TransactionListComponent {
  transactions = input<Transaction[]>([]);
  deleted = output<string>();

  getCategoryIcon(category: string): string {
    return (CATEGORY_ICONS as Record<string, string>)[category] || 'more_horiz';
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  onDelete(id: string, event: Event): void {
    event.stopPropagation();
    this.deleted.emit(id);
  }
}
