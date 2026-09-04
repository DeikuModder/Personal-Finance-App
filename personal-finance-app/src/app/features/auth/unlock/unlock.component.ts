import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { PinService } from '../../../core/services/pin.service';
import { PinEntryComponent } from '../pin-entry/pin-entry.component';

@Component({
  selector: 'app-unlock',
  standalone: true,
  imports: [PinEntryComponent],
  template: `
    <app-pin-entry (pinComplete)="onPinComplete($event)" />
  `,
})
export class UnlockComponent {
  private pinService = inject(PinService);
  private router = inject(Router);

  onPinComplete(pin: string): void {
    if (this.pinService.verifyPin(pin)) {
      sessionStorage.setItem('fintrack_authenticated', 'true');
      this.router.navigate(['/']);
    } else {
      const entry = document.querySelector<HTMLElement>('app-pin-entry');
      entry?.dispatchEvent(new CustomEvent('showError'));
    }
  }
}
