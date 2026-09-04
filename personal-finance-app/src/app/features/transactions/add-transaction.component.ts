import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TransactionFormComponent } from './components/transaction-form/transaction-form.component';
import { TransactionService } from './services/transaction.service';
import { Transaction } from '../../core/models/transaction.model';

@Component({
  selector: 'app-add-transaction',
  standalone: true,
  imports: [TransactionFormComponent],
  template: `
    <div class="add-page">
      <h1>Add Transaction</h1>
      <app-transaction-form
        (saved)="onSaved($event)"
        (cancelled)="onCancel()"
      />
    </div>
  `,
  styles: [`
    .add-page {
      max-width: 600px;
      margin: 0 auto;
    }
    h1 {
      color: #ffffff;
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0 0 1.5rem 0;
    }
  `],
})
export class AddTransactionComponent {
  private transactionService = inject(TransactionService);
  private router = inject(Router);

  onSaved(data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): void {
    this.transactionService.addTransaction(data).subscribe(() => {
      this.router.navigate(['/transactions']);
    });
  }

  onCancel(): void {
    this.router.navigate(['/transactions']);
  }
}
