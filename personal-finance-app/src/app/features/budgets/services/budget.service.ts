import { Injectable, inject } from '@angular/core';
import { Observable, map, BehaviorSubject } from 'rxjs';
import { Budget, BudgetItem } from '../../../core/models/budget.model';
import { BUDGET_REPOSITORY, BUDGET_ITEM_REPOSITORY } from '../../../core/tokens/tokens';
import { Repository } from '../../../core/repositories/repository.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable({ providedIn: 'root' })
export class BudgetService {
  private repo = inject(BUDGET_REPOSITORY) as Repository<Budget>;
  private itemRepo = inject(BUDGET_ITEM_REPOSITORY) as Repository<BudgetItem>;
  private budgets$ = new BehaviorSubject<Budget[]>([]);
  private items$ = new BehaviorSubject<BudgetItem[]>([]);
  private initialized = false;

  init(): void {
    if (this.initialized) return;
    this.initialized = true;
    this.repo.getAll().subscribe((b) => this.budgets$.next(b));
    this.itemRepo.getAll().subscribe((items) => this.items$.next(items));
  }

  getBudgets(): Observable<Budget[]> {
    this.init();
    return this.budgets$.asObservable();
  }

  getItems(): Observable<BudgetItem[]> {
    this.init();
    return this.items$.asObservable();
  }

  getItemsForBudget(budgetId: string): Observable<BudgetItem[]> {
    return this.getItems().pipe(
      map((items) => items.filter((item) => item.budgetId === budgetId))
    );
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
        this.items$.next(this.items$.value.filter((item) => item.budgetId !== id));
      })
    );
  }

  addItem(data: Omit<BudgetItem, 'id' | 'createdAt'>): Observable<BudgetItem> {
    const item: BudgetItem = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    return this.itemRepo.create(item).pipe(
      map((i) => {
        this.items$.next([...this.items$.value, i]);
        return i;
      })
    );
  }

  deleteItem(id: string): Observable<void> {
    return this.itemRepo.delete(id).pipe(
      map(() => {
        this.items$.next(this.items$.value.filter((item) => item.id !== id));
      })
    );
  }

  getBudgetAmount(budget: Budget, items: BudgetItem[]): number {
    const budgetItems = items.filter((item) => item.budgetId === budget.id);
    if (budgetItems.length > 0) {
      return budgetItems.reduce((sum, item) => sum + item.price, 0);
    }
    return budget.amount || 0;
  }

  getTotalBudget(budgets: Budget[]): number {
    return budgets.reduce((sum, b) => sum + b.amount, 0);
  }
}
