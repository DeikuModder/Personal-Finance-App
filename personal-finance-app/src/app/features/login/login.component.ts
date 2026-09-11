import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../core/auth/auth.service';
import { ErrorBannerComponent } from '../../shared/components/error-banner/error-banner.component';
import { toErrorMessage } from '../../shared/utils/http-error.util';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, ErrorBannerComponent],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  step = signal<'email' | 'otp'>('email');
  email = signal('');
  code = signal('');
  busy = signal(false);
  error = signal<string | null>(null);
  resendIn = signal(0);
  private resendTimer: ReturnType<typeof setInterval> | null = null;

  get codeComplete(): boolean {
    return this.code().length === 6;
  }

  constructor() {
    if (this.auth.hasSession()) {
      this.router.navigate(['/']);
    }
  }

  requestCode(): void {
    const email = this.email().trim();
    if (!email || this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    this.auth.requestOtp(email).subscribe({
      next: (result) => {
        this.busy.set(false);
        if (result.success) {
          this.step.set('otp');
          this.startResendCountdown();
        } else if (result.reason === 'not-allowed') {
          this.error.set("This email isn't on the allowed list yet. Ask the superadmin to add it.");
        } else {
          this.error.set('Something went wrong. Try again.');
        }
      },
      error: (err) => {
        this.busy.set(false);
        this.error.set(toErrorMessage(err));
      },
    });
  }

  onCodeChange(value: string): void {
    this.code.set(value.replace(/\D/g, '').slice(0, 6));
    if (this.code().length === 6) {
      this.verify();
    }
  }

  goBack(): void {
    this.step.set('email');
    this.code.set('');
    this.error.set(null);
  }

  verify(): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    this.auth.verifyOtp(this.email().trim(), this.code()).subscribe({
      next: (user) => {
        this.auth.setSession(user);
        if (this.resendTimer) {
          clearInterval(this.resendTimer);
          this.resendTimer = null;
        }
        const returnUrl = this.route.snapshot.queryParamMap.get('return');
        this.router.navigate([returnUrl || '/']);
      },
      error: (err) => {
        this.busy.set(false);
        this.error.set(toErrorMessage(err));
      },
    });
  }

  resend(): void {
    if (this.resendIn() > 0 || this.busy()) return;
    this.code.set('');
    this.requestCode();
  }

  private startResendCountdown(): void {
    this.resendIn.set(60);
    if (this.resendTimer) {
      clearInterval(this.resendTimer);
    }
    this.resendTimer = setInterval(() => {
      this.resendIn.update((s) => {
        if (s <= 1 && this.resendTimer) {
          clearInterval(this.resendTimer);
          this.resendTimer = null;
        }
        return Math.max(0, s - 1);
      });
    }, 1000);
  }
}