import { Injectable, inject } from '@angular/core';
import { Observable, map, BehaviorSubject } from 'rxjs';
import { WishlistItem } from '../../../core/models/wishlist.model';
import { WISHLIST_REPOSITORY } from '../../../core/tokens/tokens';
import { Repository } from '../../../core/repositories/repository.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private repo = inject(WISHLIST_REPOSITORY) as Repository<WishlistItem>;
  private items$ = new BehaviorSubject<WishlistItem[]>([]);
  private initialized = false;

  init(): void {
    if (this.initialized) return;
    this.initialized = true;
    this.repo.getAll().subscribe((server) => this.items$.next(server));
  }

  getItems(): Observable<WishlistItem[]> {
    this.init();
    return this.items$.asObservable();
  }

  addItem(data: Omit<WishlistItem, 'id' | 'createdAt' | 'updatedAt'>): Observable<WishlistItem> {
    const now = new Date().toISOString();
    const item: WishlistItem = {
      ...data,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    return this.repo.create(item).pipe(
      map((i) => {
        this.items$.next([...this.items$.value, i]);
        return i;
      })
    );
  }

  updateItem(item: WishlistItem): Observable<WishlistItem> {
    const updated = { ...item, updatedAt: new Date().toISOString() };
    return this.repo.update(updated).pipe(
      map((i) => {
        const list = this.items$.value.map((it) => (it.id === i.id ? i : it));
        this.items$.next(list);
        return i;
      })
    );
  }

  deleteItem(id: string): Observable<void> {
    return this.repo.delete(id).pipe(
      map(() => {
        this.items$.next(this.items$.value.filter((i) => i.id !== id));
      })
    );
  }

  markAchieved(item: WishlistItem): Observable<WishlistItem> {
    const updated: WishlistItem = {
      ...item,
      status: 'achieved',
      achievedAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString(),
    };
    return this.updateItem(updated);
  }
}