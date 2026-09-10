import { Component, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';
import { Debt } from '../../core/models/debt.model';
import { TransactionService } from '../transactions/services/transaction.service';
import { DebtService } from './services/debt.service';
import { DebtReminderService, DebtReminder } from './services/debt-reminder.service';
import { DebtFormComponent } from './components/debt-form/debt-form.component';
import { DebtListComponent } from './components/debt-list/debt-list.component';
import {
  DebtPayDialogComponent,
  PayDebtResult,
} from './components/debt-pay-dialog/debt-pay-dialog.component';
import {
  DebtCollectDialogComponent,
  CollectDebtResult,
} from './components/debt-collect-dialog/debt-collect-dialog.component';
import { SectionHelpComponent } from '../../shared/components/section-help/section-help';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-debts',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    CurrencyFormatPipe,
    DebtFormComponent,
    DebtListComponent,
    SectionHelpComponent,
    PageHeaderComponent,
  ],
  templateUrl: './debts.html',
  styleUrl: './debts.scss',
})
export class DebtsComponent {
  private debtService = inject(DebtService);
  private reminderService = inject(DebtReminderService);
  private transactionService = inject(TransactionService);
  private dialog = inject(MatDialog);

  debts = signal<Debt[]>([]);
  banner = signal<DebtReminder[]>([]);
  showForm = signal(false);
  editing = signal<Debt | null>(null);

  constructor() {
    this.debtService.getDebts().subscribe((debts) => {
      const sorted = [...debts].sort((a, b) => {
        if (a.status !== b.status) return a.status === 'active' ? -1 : 1;
        return a.createdAt.localeCompare(b.createdAt);
      });
      this.debts.set(sorted);
    });
    this.reminderService.getBanner().subscribe((banner) => {
      this.banner.set(banner);
    });
  }

  getTotalOwed(): number {
    return this.debtService.getTotalOwed(this.debts());
  }

  getTotalOwedToYou(): number {
    return this.debtService.getTotalOwedToYou(this.debts());
  }

  hasPayableDebts(): boolean {
    return this.debts().some((d) => d.status === 'active' && d.type !== 'receivable');
  }

  getMinPayments(): number {
    return this.debtService.getTotalMinimumPayments(this.debts());
  }

  getOverdueCount(): number {
    return this.reminderService.getOverdueCount();
  }

  getReminderText(r: DebtReminder): string {
    const receivable = r.debt.type === 'receivable';
    if (r.kind === 'overdue') {
      return receivable
        ? `${r.debt.creditor}: the payment you're owed was due on ${r.date}`
        : `${r.debt.creditor}: your payment was due on ${r.date}`;
    }
    return receivable
      ? `${r.debt.creditor}: the payment you're owed comes due on ${r.date}`
      : `${r.debt.creditor}: your payment is due on ${r.date}`;
  }

  startAdd(): void {
    this.editing.set(null);
    this.showForm.set(true);
  }

  startEdit(debt: Debt): void {
    this.editing.set(debt);
    this.showForm.set(true);
  }

  onSaved(data: Omit<Debt, 'id' | 'createdAt'>): void {
    const editing = this.editing();
    if (editing) {
      this.debtService.updateDebt({ ...editing, ...data }).subscribe();
    } else {
      this.debtService.addDebt(data).subscribe((debt) => {
        if (debt.type === 'receivable' && debt.accountId) {
          this.transactionService
            .addTransaction({
              type: 'expense',
              amount: debt.amountOwed,
              description: `Lent to ${debt.creditor}`,
              category: 'transfer',
              date: new Date().toISOString().split('T')[0],
              accountId: debt.accountId,
            })
            .subscribe();
        }
      });
    }
    this.showForm.set(false);
    this.editing.set(null);
  }

  onCancel(): void {
    this.showForm.set(false);
    this.editing.set(null);
  }

  onDelete(id: string): void {
    this.debtService.deleteDebt(id).subscribe();
  }

  onPayOff(debt: Debt): void {
    const ref = this.dialog.open(DebtPayDialogComponent, {
      data: { debt },
      width: '420px',
    });
    ref.afterClosed().subscribe((result: PayDebtResult | undefined) => {
      if (!result) return;
      this.transactionService
        .addTransaction({
          type: 'expense',
          amount: result.amount,
          description: result.description,
          category: result.category,
          date: result.date,
          accountId: result.accountId,
        })
        .subscribe(() => {
          this.debtService.markPaid(debt).subscribe();
        });
    });
  }

  onCollected(debt: Debt): void {
    const ref = this.dialog.open(DebtCollectDialogComponent, {
      data: { debt },
      width: '420px',
    });
    ref.afterClosed().subscribe((result: CollectDebtResult | undefined) => {
      if (!result) return;
      this.transactionService
        .addTransaction({
          type: 'income',
          amount: result.amount,
          description: result.description,
          category: 'transfer',
          date: result.date,
          accountId: result.accountId,
        })
        .subscribe(() => {
          this.debtService.markPaid(debt).subscribe();
        });
    });
  }

  dismissReminder(id: string): void {
    this.reminderService.dismiss(id);
  }
}