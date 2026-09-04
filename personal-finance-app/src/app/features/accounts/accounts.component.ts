import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TitleCasePipe } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';
import { Account } from '../../core/models/account.model';
import { AccountService } from './services/account.service';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [
    FormsModule,
    TitleCasePipe,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    CurrencyFormatPipe,
  ],
  templateUrl: './accounts.html',
  styleUrl: './accounts.scss',
})
export class AccountsComponent {
  private accountService = inject(AccountService);

  accounts = signal<Account[]>([]);
  showForm = signal(false);

  name = signal('');
  type = signal<Account['type']>('checking');
  balance = signal(0);

  accountTypes: { value: Account['type']; label: string }[] = [
    { value: 'checking', label: 'Checking' },
    { value: 'savings', label: 'Savings' },
    { value: 'cash', label: 'Cash' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'other', label: 'Other' },
  ];

  constructor() {
    this.accountService.getAccounts().subscribe((a) => this.accounts.set(a));
  }

  addAccount(): void {
    if (!this.name()) return;
    this.accountService.addAccount({
      name: this.name(),
      type: this.type(),
      balance: this.balance(),
      currency: 'USD',
      color: '#bb86fc',
      icon: 'account_balance_wallet',
    }).subscribe(() => {
      this.name.set('');
      this.type.set('checking');
      this.balance.set(0);
      this.showForm.set(false);
    });
  }

  deleteAccount(id: string): void {
    this.accountService.deleteAccount(id).subscribe();
  }

  getTotalBalance(): number {
    return this.accountService.getTotalBalance(this.accounts());
  }
}
