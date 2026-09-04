import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Repository } from './repository.interface';

export class HttpRepository<T extends { id: string }> implements Repository<T> {
  constructor(
    private readonly basePath: string,
    private readonly http: HttpClient
  ) {}

  getAll(): Observable<T[]> {
    return this.http.get<T[]>(this.basePath);
  }

  getById(id: string): Observable<T | undefined> {
    return this.http.get<T | undefined>(`${this.basePath}/${id}`);
  }

  create(item: T): Observable<T> {
    return this.http.post<T>(this.basePath, item);
  }

  update(item: T): Observable<T> {
    return this.http.post<T>(this.basePath, item);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.basePath}/${id}`);
  }
}
