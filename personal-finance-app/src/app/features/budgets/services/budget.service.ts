import { Injectable, inject } from '@angular/core';
import { Observable, map, BehaviorSubject } from 'rxjs';
import { Budget } from '../../../core/models/budget.model';
import { BUDGET_REPOSITORY } from '../../../core/tokens/tokens';
import { Repository } from '../../../core/repositories/repository.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable({ providedIn: 'root' })
export class BudgetService {
  private repo = inject(BUDGET_REPOSITORY) as Repository<Budget>;
  private budgets$ = new BehaviorSubject<Budget[]>([]);
  private initialized = false;

  init(): void {
    if (this.initialized) return;
    this.initialized = true;
    this.repo.getAll().subscribe((b) => this.budgets$.next(b));
  }

  getBudgets(): Observable<Budget[]> {
    this.init();
    return this.budgets$.asObservable();
  }

  getBudgetsForMonth(year: number, month: number): Observable<Budget[]> {
    return this.getBudgets().pipe(
      map((budgets) => budgets.filter((b) => b.year === year && b.month === month))
    );
  }

  addBudget(data: Omit<Budget, 'id' | 'createdAt'>): Observable<Budget> {
    const budget: Budget = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    return this.repo.create(budget).pipe(
      map((b) => {
        this.budgets$.next([...this.budgets$.value, b]);
        return b;
      })
    );
  }

  updateBudget(budget: Budget): Observable<Budget> {
    return this.repo.update(budget).pipe(
      map((b) => {
        const list = this.budgets$.value.map((item) => (item.id === b.id ? b : item));
        this.budgets$.next(list);
        return b;
      })
    );
  }

  deleteBudget(id: string): Observable<void> {
    return this.repo.delete(id).pipe(
      map(() => {
        this.budgets$.next(this.budgets$.value.filter((b) => b.id !== id));
      })
    );
  }

  getTotalBudget(budgets: Budget[]): number {
    return budgets.reduce((sum, b) => sum + b.amount, 0);
  }
}
