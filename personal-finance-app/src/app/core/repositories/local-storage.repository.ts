import { Observable, of } from 'rxjs';
import { Repository } from './repository.interface';

export class LocalStorageRepository<T extends { id: string }> implements Repository<T> {
  constructor(private storageKey: string) {}

  getAll(): Observable<T[]> {
    const data = localStorage.getItem(this.storageKey);
    return of(data ? JSON.parse(data) : []);
  }

  getById(id: string): Observable<T | undefined> {
    const data = localStorage.getItem(this.storageKey);
    const items: T[] = data ? JSON.parse(data) : [];
    return of(items.find((item) => item.id === id));
  }

  create(item: T): Observable<T> {
    const data = localStorage.getItem(this.storageKey);
    const items: T[] = data ? JSON.parse(data) : [];
    items.push(item);
    localStorage.setItem(this.storageKey, JSON.stringify(items));
    return of(item);
  }

  update(item: T): Observable<T> {
    const data = localStorage.getItem(this.storageKey);
    const items: T[] = data ? JSON.parse(data) : [];
    const index = items.findIndex((i) => i.id === item.id);
    if (index !== -1) {
      items[index] = item;
    } else {
      items.push(item);
    }
    localStorage.setItem(this.storageKey, JSON.stringify(items));
    return of(item);
  }

  delete(id: string): Observable<void> {
    const data = localStorage.getItem(this.storageKey);
    const items: T[] = data ? JSON.parse(data) : [];
    const filtered = items.filter((i) => i.id !== id);
    localStorage.setItem(this.storageKey, JSON.stringify(filtered));
    return of(undefined);
  }
}
