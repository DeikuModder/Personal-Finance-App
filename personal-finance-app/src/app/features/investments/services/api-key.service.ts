import { Injectable } from '@angular/core';

const API_KEY_STORAGE_KEY = 'fintrack_apikey';

@Injectable({ providedIn: 'root' })
export class ApiKeyService {
  getKey(): string {
    return localStorage.getItem(API_KEY_STORAGE_KEY) || '';
  }

  setKey(key: string): void {
    if (key.trim()) {
      localStorage.setItem(API_KEY_STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
    }
  }

  hasKey(): boolean {
    return this.getKey().length > 0;
  }
}