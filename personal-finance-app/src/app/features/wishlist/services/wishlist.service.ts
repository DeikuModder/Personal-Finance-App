import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, map, BehaviorSubject } from 'rxjs';
import { WishlistItem } from '../../../core/models/wishlist.model';
import { WISHLIST_REPOSITORY } from '../../../core/tokens/tokens';
import { Repository } from '../../../core/repositories/repository.interface';
import { v4 as uuidv4 } from 'uuid';

export type UploadProgressFn = (percent: number) => void;

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

  addItemWithProgress(
    data: Omit<WishlistItem, 'id' | 'createdAt' | 'updatedAt'>,
    onProgress?: UploadProgressFn
  ): Observable<WishlistItem> {
    const now = new Date().toISOString();
    const item: WishlistItem = {
      ...data,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    return this.postWithProgress(item, onProgress).pipe(
      map((i) => {
        this.items$.next([...this.items$.value, i]);
        return i;
      })
    );
  }

  updateItemWithProgress(item: WishlistItem, onProgress?: UploadProgressFn): Observable<WishlistItem> {
    const updated = { ...item, updatedAt: new Date().toISOString() };
    return this.postWithProgress(updated, onProgress).pipe(
      map((i) => {
        const list = this.items$.value.map((it) => (it.id === i.id ? i : it));
        this.items$.next(list);
        return i;
      })
    );
  }

  private postWithProgress(item: WishlistItem, onProgress?: UploadProgressFn): Observable<WishlistItem> {
    return new Observable<WishlistItem>((subscriber) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'api/wishlist');
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.withCredentials = true;
      let settled = false;

      xhr.upload.onprogress = (e) => {
        if (onProgress && e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        if (settled) return;
        settled = true;
        onProgress?.(100);
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            subscriber.next(JSON.parse(xhr.responseText) as WishlistItem);
            subscriber.complete();
          } catch {
            subscriber.error(
              new HttpErrorResponse({ status: xhr.status, statusText: xhr.statusText, error: 'Invalid server response' })
            );
          }
        } else {
          subscriber.error(this.responseError(xhr));
        }
      };

      xhr.onerror = () => {
        if (settled) return;
        settled = true;
        subscriber.error(new HttpErrorResponse({ status: 0, statusText: 'Network error', error: null }));
      };

      xhr.send(JSON.stringify(item));

      return () => {
        if (!settled) {
          settled = true;
          xhr.abort();
        }
      };
    });
  }

  private responseError(xhr: XMLHttpRequest): HttpErrorResponse {
    let body: unknown = null;
    try {
      body = JSON.parse(xhr.responseText);
    } catch {
      body = xhr.responseText || null;
    }
    return new HttpErrorResponse({ status: xhr.status, statusText: xhr.statusText, error: body });
  }
}