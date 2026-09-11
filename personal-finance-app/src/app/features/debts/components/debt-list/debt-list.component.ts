import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Debt } from '../../../../core/models/debt.model';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { PrivacyMaskPipe } from '../../../../shared/pipes/privacy-mask.pipe';
import { toLocalDate } from '../../../../core/utils/date.util';

@Component({
  selector: 'app-debt-list',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, CurrencyFormatPipe, PrivacyMaskPipe],
  templateUrl: './debt-list.html',
  styleUrl: './debt-list.scss',
})
export class DebtListComponent {
  debts = input<Debt[]>([]);
  deleted = output<string>();
  edited = output<Debt>();
  payed = output<Debt>();
  collected = output<Debt>();

  isReceivable(debt: Debt): boolean {
    return debt.type === 'receivable';
  }

  getStatusKind(debt: Debt): 'overdue' | 'due' | 'ok' | 'paid' {
    if (debt.status === 'paid') return 'paid';
    const today = startOfDay(new Date());
    const horizon = new Date(today);
    horizon.setDate(horizon.getDate() + 7);
    const effective = debt.remindOn ?? debt.dueDate;
    if (!effective) return 'ok';
    const date = startOfDay(toLocalDate(effective));
    if (date.getTime() < today.getTime()) return 'overdue';
    if (date.getTime() <= horizon.getTime()) return 'due';
    return 'ok';
  }

  getStatusLabel(debt: Debt): string {
    switch (this.getStatusKind(debt)) {
      case 'overdue':
        return debt.type === 'receivable' ? 'Overdue (they owe you)' : 'Overdue';
      case 'due':
        return 'Due soon';
      case 'paid':
        return debt.type === 'receivable' ? 'Collected' : 'Paid';
      default:
        return debt.type === 'receivable' ? 'Expected' : 'On track';
    }
  }

  getAnnualInterest(debt: Debt): number {
    return debt.amountOwed * (debt.interestRate || 0) / 100;
  }

  onDelete(id: string, event: Event): void {
    event.stopPropagation();
    this.deleted.emit(id);
  }

  onEdit(debt: Debt, event: Event): void {
    event.stopPropagation();
    this.edited.emit(debt);
  }

  onPay(debt: Debt, event: Event): void {
    event.stopPropagation();
    this.payed.emit(debt);
  }

  onCollected(debt: Debt, event: Event): void {
    event.stopPropagation();
    this.collected.emit(debt);
  }
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}