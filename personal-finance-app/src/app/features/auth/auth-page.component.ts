import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { PinService } from '../../core/services/pin.service';
import { PinSetupComponent } from './pin-setup/pin-setup.component';

@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [PinSetupComponent],
  template: `
    <app-pin-setup (success)="onSetup($event)" (skip)="onSkip()" />
  `,
})
export class AuthPageComponent {
  private pinService = inject(PinService);
  private router = inject(Router);

  onSetup(pin: string): void {
    this.pinService.setPin(pin);
    sessionStorage.setItem('fintrack_authenticated', 'true');
    this.router.navigate(['/']);
  }

  onSkip(): void {
    this.router.navigate(['/']);
  }
}
