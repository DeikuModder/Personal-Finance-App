import { Injectable } from '@angular/core';
import { PinConfig } from '../models/pin.model';

const PIN_STORAGE_KEY = 'fintrack_pin';

@Injectable({ providedIn: 'root' })
export class PinService {
  private hashPin(pin: string): string {
    let hash = 0;
    for (let i = 0; i < pin.length; i++) {
      const char = pin.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return hash.toString(36);
  }

  isPinSet(): boolean {
    return localStorage.getItem(PIN_STORAGE_KEY) !== null;
  }

  setPin(pin: string): void {
    const config: PinConfig = {
      hash: this.hashPin(pin),
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(config));
  }

  verifyPin(pin: string): boolean {
    const data = localStorage.getItem(PIN_STORAGE_KEY);
    if (!data) return true;
    const config: PinConfig = JSON.parse(data);
    return config.hash === this.hashPin(pin);
  }

  removePin(): void {
    localStorage.removeItem(PIN_STORAGE_KEY);
  }

  changePin(oldPin: string, newPin: string): boolean {
    if (!this.verifyPin(oldPin)) return false;
    this.setPin(newPin);
    return true;
  }
}
