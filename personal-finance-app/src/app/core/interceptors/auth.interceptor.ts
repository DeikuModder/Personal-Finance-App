import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, from, switchMap, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private auth = inject(AuthService);
  private router = inject(Router);

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const url = req.url;
    if (
      url.includes('/api/auth/refresh') ||
      url.includes('/api/auth/request-otp') ||
      url.includes('/api/auth/verify-otp')
    ) {
      return next.handle(req);
    }

    return next.handle(req).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401) {
          return from(this.auth.refreshOnce()).pipe(
            switchMap((refreshed) => {
              if (refreshed) {
                return next.handle(req);
              }
              this.auth.clearSession();
              if (this.router.url !== '/login') {
                this.router.navigate(['/login'], { queryParams: { return: this.router.url } });
              }
              return throwError(() => err);
            })
          );
        }
        return throwError(() => err);
      })
    );
  }
}