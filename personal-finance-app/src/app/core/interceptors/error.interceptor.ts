import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 0) {
          console.error('Network error or CORS blocked while reaching the API.', err);
        } else {
          const message =
            err.error && typeof err.error === 'object' && 'message' in err.error
              ? (err.error as { message: string }).message
              : `Request failed with status ${err.status}`;
          console.error(message, err);
        }
        return throwError(() => err);
      })
    );
  }
}
