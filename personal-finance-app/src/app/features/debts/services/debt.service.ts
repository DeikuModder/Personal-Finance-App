import { Injectable, inject } from '@angular/core';
import { Observable, map, BehaviorSubject } from 'rxjs';
import { Debt } from '../../../core/models/debt.model';
import { DEBT_REPOSITORY } from '../../../core/tokens/tokens';
import { Repository } from '../../../core/repositories/repository.interface';
import { toLocalDate } from '../../../core/utils/date.util';
import { v4 as uuidv4 } from 'uuid';

@Injectable({ providedIn: 'root' })
export class DebtService {
  private repo = inject(DEBT_REPOSITORY) as Repository<Debt>;
  private debts$ = new BehaviorSubject<Debt[]>([]);
  private initialized = false;

  init(): void {
    if (this.initialized) return;
    this.initialized = true;
    this.repo.getAll().subscribe((server) => this.debts$.next(server));
  }

  getDebts(): Observable<Debt[]> {
    this.init();
    return this.debts$.asObservable();
  }

  getActiveDebts(): Observable<Debt[]> {
    return this.getDebts().pipe(
      map((debts) => debts.filter((d) => d.status === 'active'))
    );
  }

  addDebt(data: Omit<Debt, 'id' | 'createdAt'>): Observable<Debt> {
    const debt: Debt = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    return this.repo.create(debt).pipe(
      map((d) => {
        this.debts$.next([...this.debts$.value, d]);
        return d;
      })
    );
  }

  updateDebt(debt: Debt): Observable<Debt> {
    return this.repo.update(debt).pipe(
      map((d) => {
        const list = this.debts$.value.map((item) => (item.id === d.id ? d : item));
        this.debts$.next(list);
        return d;
      })
    );
  }

  deleteDebt(id: string): Observable<void> {
    return this.repo.delete(id).pipe(
      map(() => {
        this.debts$.next(this.debts$.value.filter((d) => d.id !== id));
      })
    );
  }

  markPaid(debt: Debt): Observable<Debt> {
    const updated: Debt = {
      ...debt,
      status: 'paid',
      paidAt: new Date().toISOString().split('T')[0],
    };
    return this.updateDebt(updated);
  }

  getTotalOwed(debts: Debt[]): number {
    return debts
      .filter((d) => d.status === 'active' && d.type !== 'receivable')
      .reduce((sum, d) => sum + d.amountOwed, 0);
  }

  getTotalOwedToYou(debts: Debt[]): number {
    return debts
      .filter((d) => d.status === 'active' && d.type === 'receivable')
      .reduce((sum, d) => sum + d.amountOwed, 0);
  }

  getTotalMinimumPayments(debts: Debt[]): number {
    return debts
      .filter((d) => d.status === 'active' && d.type !== 'receivable')
      .reduce((sum, d) => sum + (d.minimumPayment || 0), 0);
  }

  getOverdueCount(debts: Debt[]): number {
    const today = new Date();
    return debts.filter((d) => {
      if (d.status !== 'active') return false;
      const date = d.dueDate ? toLocalDate(d.dueDate) : null;
      return date !== null && date.getTime() < startOfDay(today).getTime();
    }).length;
  }
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}