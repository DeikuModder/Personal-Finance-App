import { Observable } from 'rxjs';

export interface Repository<T> {
  getAll(): Observable<T[]>;
  getById(id: string): Observable<T | undefined>;
  create(item: T): Observable<T>;
  update(item: T): Observable<T>;
  delete(id: string): Observable<void>;
}
