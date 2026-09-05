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
import { SectionHelpComponent } from '../../shared/components/section-help/section-help';

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
    SectionHelpComponent,
  ],
  templateUrl: './accounts.html',
  styleUrl: './accounts.scss',
})
export class AccountsComponent {
  private accountService = inject(AccountService);

  accounts = signal<Account[]>([]);
  showForm = signal(false);
  editingId = signal<string | null>(null);

  name = signal('');
  type = signal<Account['type']>('checking');

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

  toggleForm(): void {
    if (this.showForm()) {
      this.resetForm();
    } else {
      this.showForm.set(true);
    }
  }

  editAccount(account: Account): void {
    this.editingId.set(account.id);
    this.name.set(account.name);
    this.type.set(account.type);
    this.showForm.set(true);
  }

  saveAccount(): void {
    if (!this.name()) return;
    const editing = this.editingId();
    if (editing) {
      const current = this.accounts().find((a) => a.id === editing);
      if (!current) return;
      this.accountService
        .updateAccount({
          ...current,
          name: this.name(),
          type: this.type(),
        })
        .subscribe(() => this.resetForm());
    } else {
      this.addAccount();
    }
  }

  addAccount(): void {
    this.accountService.addAccount({
      name: this.name(),
      type: this.type(),
      balance: 0,
      currency: 'USD',
      color: '#ff6e6e',
      icon: 'account_balance_wallet',
    }).subscribe(() => this.resetForm());
  }

  resetForm(): void {
    this.name.set('');
    this.type.set('checking');
    this.editingId.set(null);
    this.showForm.set(false);
  }

  deleteAccount(id: string): void {
    this.accountService.deleteAccount(id).subscribe();
  }

  getTotalBalance(): number {
    return this.accountService.getTotalBalance(this.accounts());
  }
}
