import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { Debt, DebtStatus } from '../../../../core/models/debt.model';

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
  ],
  templateUrl: './debt-form.html',
  styleUrl: './debt-form.scss',
})
export class DebtFormComponent {
  editing = input<Debt | null>(null);
  saved = output<Omit<Debt, 'id' | 'createdAt'>>();
  cancelled = output<void>();

  creditor = signal('');
  description = signal('');
  amountOwed = signal(0);
  interestRate = signal(0);
  minimumPayment = signal(0);
  status = signal<DebtStatus>('active');
  dueDate = signal<Date | null>(null);
  remindOn = signal<Date | null>(null);

  constructor() {
    const d = this.editing();
    if (!d) return;
    this.creditor.set(d.creditor);
    this.description.set(d.description ?? '');
    this.amountOwed.set(d.amountOwed);
    this.interestRate.set(d.interestRate || 0);
    this.minimumPayment.set(d.minimumPayment || 0);
    this.status.set(d.status);
    this.dueDate.set(d.dueDate ? new Date(d.dueDate) : null);
    this.remindOn.set(d.remindOn ? new Date(d.remindOn) : null);
  }

  get clean(): boolean {
    return this.creditor().trim() !== '' && this.amountOwed() >= 0;
  }

  onSubmit(): void {
    if (!this.clean) return;
    this.saved.emit({
      creditor: this.creditor().trim(),
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