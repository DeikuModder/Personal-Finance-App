import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Transaction } from '../../core/models/transaction.model';
import { CategoryOption } from '../../core/models/category.model';
import { CategoryService } from '../../core/services/category.service';
import { TransactionService } from './services/transaction.service';
import { toLocalDate } from '../../core/utils/date.util';
import { TransactionListComponent } from './components/transaction-list/transaction-list.component';
import { SectionHelpComponent } from '../../shared/components/section-help/section-help';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { PrivacyToggleComponent } from '../../shared/components/privacy-toggle/privacy-toggle.component';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [
    FormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    TransactionListComponent,
    SectionHelpComponent,
    PageHeaderComponent,
    PrivacyToggleComponent,
  ],
  templateUrl: './transactions.html',
  styleUrl: './transactions.scss',
})
export class TransactionsComponent {
  private transactionService = inject(TransactionService);
  private categoryService = inject(CategoryService);
  private router = inject(Router);

  allTransactions = signal<Transaction[]>([]);
  filteredTransactions = signal<Transaction[]>([]);

  typeFilter = signal<'all' | 'income' | 'expense' | 'transfer'>('all');
  categoryFilter = signal<string | 'all'>('all');
  monthFilter = signal<'all' | 'current' | 'last' | 'thisYear'>('current');

  categories = signal<CategoryOption[]>([]);

  constructor() {
    this.categoryService.getAllOptions().subscribe((options) => {
      this.categories.set(options);
    });
    this.transactionService.getTransactions().subscribe((transactions) => {
      this.allTransactions.set(
        [...transactions].sort((a, b) => toLocalDate(b.date).getTime() - toLocalDate(a.date).getTime())
      );
      this.applyFilters();
    });
  }

  applyFilters(): void {
    let result = this.allTransactions();

    if (this.typeFilter() !== 'all') {
      result = result.filter((t) => t.type === this.typeFilter());
    }

    if (this.categoryFilter() !== 'all') {
      result = result.filter((t) => t.category === this.categoryFilter());
    }

    const now = new Date();
    if (this.monthFilter() === 'current') {
      result = result.filter((t) => {
        const d = toLocalDate(t.date);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      });
    } else if (this.monthFilter() === 'last') {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      result = result.filter((t) => {
        const d = toLocalDate(t.date);
        return d.getFullYear() === lastMonth.getFullYear() && d.getMonth() === lastMonth.getMonth();
      });
    } else if (this.monthFilter() === 'thisYear') {
      result = result.filter((t) => {
        const d = toLocalDate(t.date);
        return d.getFullYear() === now.getFullYear();
      });
    }

    this.filteredTransactions.set(result);
  }

  clearFilters(): void {
    this.typeFilter.set('all');
    this.categoryFilter.set('all');
    this.monthFilter.set('current');
    this.applyFilters();
  }

  onDelete(id: string): void {
    this.transactionService.deleteTransaction(id).subscribe(() => {
      this.applyFilters();
    });
  }

  onEdit(id: string): void {
    this.router.navigate(['/transactions', id, 'edit']);
  }

  goToAdd(): void {
    this.router.navigate(['/add']);
  }

  get hasFilters(): boolean {
    return this.typeFilter() !== 'all' || this.categoryFilter() !== 'all' || this.monthFilter() !== 'current';
  }
}
