import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TransactionFormComponent } from './components/transaction-form/transaction-form.component';
import { TransactionService } from './services/transaction.service';
import { Transaction } from '../../core/models/transaction.model';
import { SectionHelpComponent } from '../../shared/components/section-help/section-help';

@Component({
  selector: 'app-add-transaction',
  standalone: true,
  imports: [TransactionFormComponent, SectionHelpComponent],
  template: `
    <div class="add-page">
      <h1>Add Transaction</h1>
      <app-section-help
        title="How adding works"
        description="Record every time money comes in (Income), goes out (Expense), or moves between your own accounts (Transfer). Each entry needs an amount, a description and an account. It is saved instantly and feeds the dashboard, budgets and Money Quest."
        [howTo]="[
          'Pick Expense, Income or Transfer at the top — this decides how it affects your balance.',
          'Enter the amount (numbers only, e.g. 45.50) and a short description.',
          'For Income/Expense, choose a category so your spending and income are grouped correctly on the Home charts.',
          'For a Transfer, pick the From account (where the money leaves) and the To account (where it lands) — it never counts as spending or income.',
          'Choose the account and date, then tap Save. You can review or edit it later from the Transactions list.'
        ]"
      />
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
      margin: 0 0 0.5rem 0;
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
