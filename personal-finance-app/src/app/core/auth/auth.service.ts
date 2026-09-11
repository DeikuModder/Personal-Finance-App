import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, lastValueFrom, of, tap } from 'rxjs';

export interface SessionUser {
  id: string;
  email: string;
  role: string;
}

export interface RequestOtpResult {
  success: boolean;
  reason?: string;
}

export interface AllowedEmailItem {
  id: string;
  email: string;
  note: string | null;
  createdAt: string;
}

const SESSION_KEY = 'fintrack_session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  me = signal<SessionUser | null>(null);
  private refreshInFlight: Promise<boolean> | null = null;

  hasSession(): boolean {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  }

  setSession(user: SessionUser): void {
    sessionStorage.setItem(SESSION_KEY, '1');
    this.me.set(user);
  }

  clearSession(): void {
    sessionStorage.removeItem(SESSION_KEY);
    this.me.set(null);
  }

  /** Validates the server session (used on app boot); 401s trigger the auth interceptor. */
  loadMe(): void {
    this.http.get<SessionUser>('/api/auth/me').subscribe({
      next: (user) => this.me.set(user),
      error: () => this.clearSession(),
    });
  }

  requestOtp(email: string) {
    return this.http.post<RequestOtpResult>('/api/auth/request-otp', { email });
  }

  verifyOtp(email: string, code: string) {
    return this.http.post<SessionUser>('/api/auth/verify-otp', { email, code });
  }

  logout() {
    return this.http.post<{ success: boolean }>('/api/auth/logout', {}).pipe(
      catchError(() => of({ success: false })),
      tap(() => this.clearSession()),
      tap(() => this.router.navigate(['/login']))
    );
  }

  /** Single-flight refresh. Returns true when a new access token was issued. */
  refreshOnce(): Promise<boolean> {
    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }
    this.refreshInFlight = lastValueFrom(
      this.http.post<{ ok: boolean }>('/api/auth/refresh', {}).pipe(catchError(() => of({ ok: false })))
    )
      .then(() => true)
      .catch(() => false)
      .finally(() => {
        this.refreshInFlight = null;
      });
    return this.refreshInFlight;
  }

  getAllowlist() {
    return this.http.get<AllowedEmailItem[]>('/api/auth/allowlist');
  }

  addAllowlist(email: string) {
    return this.http.post<AllowedEmailItem>('/api/auth/allowlist', { email });
  }

  removeAllowlist(email: string) {
    return this.http.delete<{ success: boolean }>(`/api/auth/allowlist/${encodeURIComponent(email)}`);
  }
}