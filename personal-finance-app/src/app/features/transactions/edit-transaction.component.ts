import { Component, inject, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { TransactionFormComponent } from './components/transaction-form/transaction-form.component';
import { TransactionService } from './services/transaction.service';
import { Transaction } from '../../core/models/transaction.model';

@Component({
  selector: 'app-edit-transaction',
  standalone: true,
  imports: [TransactionFormComponent],
  template: `
    <div class="edit-page">
      <h1>Edit Transaction</h1>
      @if (transaction(); as t) {
        <app-transaction-form [transaction]="t" (saved)="onSaved($event)" (cancelled)="onCancel()" />
      } @else {
        <p class="loading">Loading…</p>
      }
    </div>
  `,
  styles: [
    `
      .edit-page {
        max-width: 600px;
        margin: 0 auto;
      }
      h1 {
        color: #fff;
        font-size: 1.5rem;
        font-weight: 700;
        margin: 0 0 0.5rem;
      }
      .loading {
        color: #9e9e9e;
      }
    `,
  ],
})
export class EditTransactionComponent {
  private transactionService = inject(TransactionService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  private id = this.route.snapshot.paramMap.get('id') ?? '';
  transaction = signal<Transaction | null>(null);

  constructor() {
    this.transactionService.getTransactions().subscribe((list) => {
      const found = list.find((t) => t.id === this.id) ?? null;
      this.transaction.set(found);
      if (!found) {
        this.router.navigate(['/transactions']);
      }
    });
  }

  onSaved(data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): void {
    const current = this.transaction();
    if (!current) return;
    this.transactionService.updateTransaction({ ...current, ...data }).subscribe(() => {
      this.router.navigate(['/transactions']);
    });
  }

  onCancel(): void {
    this.router.navigate(['/transactions']);
  }
}