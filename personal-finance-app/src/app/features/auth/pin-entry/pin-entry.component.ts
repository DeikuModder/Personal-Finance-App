import { Component, HostListener, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-pin-entry',
  standalone: true,
  imports: [FormsModule, MatIconModule, MatButtonModule],
  templateUrl: './pin-entry.html',
  styleUrl: './pin-entry.scss',
})
export class PinEntryComponent {
  pin = signal('');
  error = signal(false);
  pinComplete = output<string>();

  addDigit(digit: string): void {
    if (this.pin().length < 6) {
      this.pin.update((p) => p + digit);
      this.error.set(false);
      if (this.pin().length === 6) {
        setTimeout(() => this.pinComplete.emit(this.pin()), 200);
      }
    }
  }

  removeDigit(): void {
    this.pin.update((p) => p.slice(0, -1));
    this.error.set(false);
  }

  clear(): void {
    this.pin.set('');
    this.error.set(false);
  }

  showError(): void {
    this.error.set(true);
    setTimeout(() => {
      this.clear();
    }, 800);
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
      return;
    }

    if (event.key === 'Backspace') {
      event.preventDefault();
      this.removeDigit();
      return;
    }

    if (event.key.length === 1 && event.key >= '0' && event.key <= '9') {
      event.preventDefault();
      this.addDigit(event.key);
    }
  }
}
