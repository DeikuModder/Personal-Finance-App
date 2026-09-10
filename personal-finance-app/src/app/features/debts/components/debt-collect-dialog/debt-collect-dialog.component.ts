import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { Debt } from '../../../../core/models/debt.model';
import { Account } from '../../../../core/models/account.model';
import { AccountService } from '../../../accounts/services/account.service';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';

export interface CollectDebtResult {
  accountId: string;
  amount: number;
  date: string;
  description: string;
}

@Component({
  selector: 'app-debt-collect-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    CurrencyFormatPipe,
  ],
  templateUrl: './debt-collect-dialog.html',
  styleUrl: './debt-collect-dialog.scss',
})
export class DebtCollectDialogComponent {
  private dialogRef = inject(MatDialogRef<DebtCollectDialogComponent>);
  private accountService = inject(AccountService);
  data = inject<{ debt: Debt }>(MAT_DIALOG_DATA);

  accounts = signal<Account[]>([]);
  accountId = signal(this.data.debt.accountId ?? '');
  amount = signal(this.data.debt.amountOwed);
  date = signal(new Date());
  description = signal(`Repayment from ${this.data.debt.creditor}`);

  constructor() {
    this.accountService.getAccounts().subscribe((accounts) => {
      this.accounts.set(accounts);
      if (!this.accountId()) {
        if (accounts.length > 0) this.accountId.set(accounts[0].id);
      }
    });
  }

  get valid(): boolean {
    return this.accountId() !== '' && this.amount() > 0;
  }

  confirm(): void {
    if (!this.valid) return;
    const result: CollectDebtResult = {
      accountId: this.accountId(),
      amount: Number(this.amount()),
      date: this.date().toISOString().split('T')[0],
      description: this.description().trim() || `Repayment from ${this.data.debt.creditor}`,
    };
    this.dialogRef.close(result);
  }
}