import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, lastValueFrom, of, tap } from 'rxjs';

export interface SessionUser {
  id: string;
  email: string;
  role: string;
}

export interface AuthSession extends SessionUser {
  expiresIn: number;
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

const REFRESH_BUFFER_MS = 60_000;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  me = signal<SessionUser | null>(null);
  private refreshInFlight: Promise<boolean> | null = null;
  private restoreInFlight: Promise<boolean> | null = null;
  private tokenExpiresAt = 0;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private watcherAttached = false;

  constructor() {
    this.attachSessionWatcher();
  }

  /**
   * Server-validated session restore. The HttpOnly cookies are the single
   * source of truth: /me answers are only possible when the API accepts the
   * cookies, and a 401 flows through the auth interceptor for an async refresh.
   */
  restoreSession(): Promise<boolean> {
    if (this.me()) {
      return Promise.resolve(true);
    }
    if (this.restoreInFlight) {
      return this.restoreInFlight;
    }
    this.restoreInFlight = lastValueFrom(
      this.http.get<AuthSession>('/api/auth/me').pipe(
        tap((session) => this.applySession(session)),
        catchError(() => of(null))
      )
    )
      .then((session) => session !== null)
      .finally(() => {
        this.restoreInFlight = null;
      });
    return this.restoreInFlight;
  }

  requestOtp(email: string) {
    return this.http.post<RequestOtpResult>('/api/auth/request-otp', { email });
  }

  verifyOtp(email: string, code: string) {
    return this.http.post<AuthSession>('/api/auth/verify-otp', { email, code }).pipe(
      tap((session) => this.applySession(session))
    );
  }

  logout() {
    this.clearLocalState();
    return this.http.post<{ success: boolean }>('/api/auth/logout', {}).pipe(
      catchError(() => of({ success: false })),
      tap(() => this.router.navigate(['/login']))
    );
  }

  /** Single-flight refresh. Returns true when a new access token was issued. */
  refreshOnce(): Promise<boolean> {
    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }
    this.refreshInFlight = lastValueFrom(
      this.http.post<{ ok: boolean; expiresIn: number }>('/api/auth/refresh', {}).pipe(
        catchError(() => of({ ok: false, expiresIn: 0 }))
      )
    )
      .then((res) => {
        if (res.ok) {
          this.scheduleRefresh(res.expiresIn);
          return true;
        }
        this.clearLocalState();
        return false;
      })
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

  clearLocalState(): void {
    this.me.set(null);
    this.clearRefreshTimer();
    this.tokenExpiresAt = 0;
  }

  private applySession(session: AuthSession): void {
    this.me.set({ id: session.id, email: session.email, role: session.role });
    this.scheduleRefresh(session.expiresIn);
  }

  private scheduleRefresh(expiresInSec: number): void {
    this.tokenExpiresAt = Date.now() + expiresInSec * 1000;
    this.clearRefreshTimer();
    const delay = Math.max(0, this.tokenExpiresAt - Date.now() - REFRESH_BUFFER_MS);
    this.refreshTimer = setTimeout(() => {
      this.refreshTimer = null;
      void this.refreshOnce();
    }, delay);
  }

  private clearRefreshTimer(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  private attachSessionWatcher(): void {
    if (this.watcherAttached || typeof document === 'undefined' || typeof window === 'undefined') {
      return;
    }
    this.watcherAttached = true;
    const maybeRefresh = () => {
      if (this.tokenExpiresAt && this.tokenExpiresAt - Date.now() < REFRESH_BUFFER_MS) {
        void this.refreshOnce();
      }
    };
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        maybeRefresh();
      }
    });
    window.addEventListener('focus', maybeRefresh);
  }
}