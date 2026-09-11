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
import { CategoryOption } from '../../../../core/models/category.model';
import { CategoryService } from '../../../../core/services/category.service';
import { AccountService } from '../../../accounts/services/account.service';
import { Account } from '../../../../core/models/account.model';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { PrivacyMaskPipe } from '../../../../shared/pipes/privacy-mask.pipe';

export interface PayDebtResult {
  accountId: string;
  category: string;
  amount: number;
  date: string;
  description: string;
}

@Component({
  selector: 'app-debt-pay-dialog',
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
    PrivacyMaskPipe,
  ],
  templateUrl: './debt-pay-dialog.html',
  styleUrl: './debt-pay-dialog.scss',
})
export class DebtPayDialogComponent {
  private dialogRef = inject(MatDialogRef<DebtPayDialogComponent>);
  private accountService = inject(AccountService);
  private categoryService = inject(CategoryService);
  data = inject<{ debt: Debt }>(MAT_DIALOG_DATA);

  accounts = signal<Account[]>([]);
  categories = signal<CategoryOption[]>([]);

  accountId = signal('');
  category = signal('other');
  amount = signal(this.data.debt.amountOwed);
  date = signal(new Date());
  description = signal(`Payment to ${this.data.debt.creditor}`);

  constructor() {
    this.accountService.getAccounts().subscribe((accounts) => {
      this.accounts.set(accounts);
      if (accounts.length > 0 && !this.accountId()) {
        this.accountId.set(accounts[0].id);
      }
    });
    this.categoryService.getOptions('expense').subscribe((options) => {
      this.categories.set(options);
    });
  }

  get valid(): boolean {
    return this.accountId() !== '' && this.amount() > 0;
  }

  confirm(): void {
    if (!this.valid) return;
    const result: PayDebtResult = {
      accountId: this.accountId(),
      category: this.category(),
      amount: Number(this.amount()),
      date: this.date().toISOString().split('T')[0],
      description: this.description().trim() || `Payment to ${this.data.debt.creditor}`,
    };
    this.dialogRef.close(result);
  }
}