import { Component, output, signal, viewChild } from '@angular/core';
import { PinEntryComponent } from '../pin-entry/pin-entry.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-pin-setup',
  standalone: true,
  imports: [PinEntryComponent, MatIconModule, MatButtonModule],
  templateUrl: './pin-setup.html',
  styleUrl: './pin-setup.scss',
})
export class PinSetupComponent {
  pinEntry = viewChild(PinEntryComponent);
  step = signal<'enter' | 'confirm'>('enter');
  firstPin = signal('');
  error = signal(false);
  success = output<string>();
  skip = output<void>();

  onPinComplete(pin: string): void {
    if (this.step() === 'enter') {
      this.firstPin.set(pin);
      this.step.set('confirm');
      this.pinEntry()?.clear();
    } else {
      if (pin === this.firstPin()) {
        this.success.emit(pin);
      } else {
        this.error.set(true);
        setTimeout(() => {
          this.error.set(false);
          this.step.set('enter');
          this.firstPin.set('');
          this.pinEntry()?.clear();
        }, 800);
      }
    }
  }

  onSkip(): void {
    this.skip.emit();
  }
}
