import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { Debt, DebtStatus, DebtType } from '../../../../core/models/debt.model';
import { Account } from '../../../../core/models/account.model';
import { AccountService } from '../../../accounts/services/account.service';

@Component({
  selector: 'app-debt-form',
  standalone: true,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
  ],
  templateUrl: './debt-form.html',
  styleUrl: './debt-form.scss',
})
export class DebtFormComponent {
  private accountService = inject(AccountService);

  editing = input<Debt | null>(null);
  saved = output<Omit<Debt, 'id' | 'createdAt'>>();
  cancelled = output<void>();

  accounts = signal<Account[]>([]);
  creditor = signal('');
  type = signal<DebtType>('payable');
  accountId = signal<string | null>(null);
  description = signal('');
  amountOwed = signal(0);
  interestRate = signal(0);
  minimumPayment = signal(0);
  status = signal<DebtStatus>('active');
  dueDate = signal<Date | null>(null);
  remindOn = signal<Date | null>(null);

  constructor() {
    this.accountService.getAccounts().subscribe((accounts) => {
      this.accounts.set(accounts);
      if (accounts.length > 0 && this.type() === 'receivable' && !this.accountId()) {
        this.accountId.set(accounts[0].id);
      }
    });
    const d = this.editing();
    if (!d) return;
    this.creditor.set(d.creditor);
    this.type.set(d.type ?? 'payable');
    this.accountId.set(d.accountId ?? null);
    this.description.set(d.description ?? '');
    this.amountOwed.set(d.amountOwed);
    this.interestRate.set(d.interestRate || 0);
    this.minimumPayment.set(d.minimumPayment || 0);
    this.status.set(d.status);
    this.dueDate.set(d.dueDate ? new Date(d.dueDate) : null);
    this.remindOn.set(d.remindOn ? new Date(d.remindOn) : null);
  }

  setType(next: DebtType): void {
    this.type.set(next);
    if (next === 'receivable' && !this.accountId()) {
      const accounts = this.accounts();
      if (accounts.length > 0) this.accountId.set(accounts[0].id);
    }
  }

  getCreditorLabel(): string {
    return this.type() === 'receivable' ? 'Debtor' : 'Creditor';
  }

  getCreditorHint(): string {
    return this.type() === 'receivable'
      ? 'e.g. Miguel, roommate, freelance client'
      : 'e.g. Chase Bank, friend, car loan';
  }

  get clean(): boolean {
    const hasCreditor = this.creditor().trim() !== '';
    if (this.type() === 'receivable') {
      return hasCreditor && this.amountOwed() >= 0 && this.accountId() !== null && this.accountId() !== '';
    }
    return hasCreditor && this.amountOwed() >= 0;
  }

  onSubmit(): void {
    if (!this.clean) return;
    this.saved.emit({
      creditor: this.creditor().trim(),
      type: this.type(),
      accountId: this.type() === 'receivable' ? this.accountId() : null,
      description: this.description().trim() || null,
      amountOwed: Number(this.amountOwed()),
      interestRate: Number(this.interestRate() || 0),
      minimumPayment: Number(this.minimumPayment() || 0),
      status: this.status(),
      dueDate: this.dueDate() ? this.dueDate()!.toISOString().split('T')[0] : null,
      remindOn: this.remindOn() ? this.remindOn()!.toISOString().split('T')[0] : null,
      paidAt: this.status() === 'active' ? null : this.editing()?.paidAt ?? null,
    });
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}