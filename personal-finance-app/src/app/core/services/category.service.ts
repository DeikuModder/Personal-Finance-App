import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import {
  Category,
  CategoryOption,
  TransactionCategory,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  CATEGORY_ICONS,
} from '../models/category.model';
import { CATEGORY_REPOSITORY } from '../tokens/tokens';
import { Repository } from '../repositories/repository.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private repo = inject(CATEGORY_REPOSITORY) as Repository<Category>;
  private categories$ = new BehaviorSubject<Category[]>([]);
  private initialized = false;

  private builtInLabels: Record<string, string> = {};
  labels: Record<string, string> = {};
  icons: Record<string, string> = {};

  constructor() {
    this.builtInLabels = {};
    for (const c of [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES, { value: 'transfer', label: 'Transfer' }]) {
      this.builtInLabels[c.value] = c.label;
    }
    this.labels = { ...this.builtInLabels };
    this.icons = { ...(CATEGORY_ICONS as Record<string, string>) };
  }

  init(): void {
    if (this.initialized) return;
    this.initialized = true;
    this.repo.getAll().subscribe((server) => {
      this.setCustom(server);
    });
  }

  getCategories(): Observable<Category[]> {
    this.init();
    return this.categories$.asObservable();
  }

  getOptions(type: 'income' | 'expense'): Observable<CategoryOption[]> {
    return this.getCategories().pipe(
      map((customs) => {
        const source = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
        const builtIns: CategoryOption[] = source.map((c) => ({
          value: c.value,
          label: c.label,
          icon: CATEGORY_ICONS[c.value],
        }));
        const custom = customs
          .filter((c) => c.type === type)
          .map((c) => ({ value: c.id, label: c.label, icon: c.icon }));
        return [...builtIns, ...custom];
      })
    );
  }

  getAllOptions(): Observable<CategoryOption[]> {
    return this.getCategories().pipe(
      map((customs) => {
        const builtIns: CategoryOption[] = [
          ...INCOME_CATEGORIES,
          ...EXPENSE_CATEGORIES,
          { value: 'transfer', label: 'Transfer', icon: CATEGORY_ICONS.transfer },
        ].map((c) => ({ value: c.value, label: c.label, icon: CATEGORY_ICONS[c.value as TransactionCategory] }));
        return [...builtIns, ...customs.map((c) => ({ value: c.id, label: c.label, icon: c.icon }))];
      })
    );
  }

  getLabel(value: string): string {
    return this.labels[value] ?? value;
  }

  getIcon(value: string): string {
    return this.icons[value] ?? 'more_horiz';
  }

  create(data: Omit<Category, 'id' | 'createdAt'>): Observable<Category> {
    const category: Category = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    return this.repo.create(category).pipe(
      tap((c) => {
        this.setCustom([...this.categories$.value, c]);
      })
    );
  }

  remove(id: string): Observable<void> {
    return this.repo.delete(id).pipe(
      tap(() => {
        this.setCustom(this.categories$.value.filter((c) => c.id !== id));
      })
    );
  }

  private setCustom(customs: Category[]): void {
    this.categories$.next(customs);
    const labels: Record<string, string> = { ...this.builtInLabels };
    const icons: Record<string, string> = { ...(CATEGORY_ICONS as Record<string, string>) };
    for (const c of customs) {
      labels[c.id] = c.label;
      icons[c.id] = c.icon;
    }
    this.labels = labels;
    this.icons = icons;
  }
}