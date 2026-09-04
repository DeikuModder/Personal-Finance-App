import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TitleCasePipe } from '@angular/common';
import { Transaction } from '../../../../core/models/transaction.model';
import { CATEGORY_ICONS } from '../../../../core/models/category.model';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { MatIconModule } from '@angular/material/icon';
import { toLocalDate } from '../../../../core/utils/date.util';

@Component({
  selector: 'app-recent-transactions',
  standalone: true,
  imports: [RouterLink, TitleCasePipe, CurrencyFormatPipe, MatIconModule],
  templateUrl: './recent-transactions.html',
  styleUrl: './recent-transactions.scss',
})
export class RecentTransactionsComponent {
  transactions = input<Transaction[]>([]);

  getCategoryIcon(category: string): string {
    return (CATEGORY_ICONS as Record<string, string>)[category] || 'more_horiz';
  }

  formatDate(dateStr: string): string {
    const date = toLocalDate(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
