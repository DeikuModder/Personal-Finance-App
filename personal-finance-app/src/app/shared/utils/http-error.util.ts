import { HttpErrorResponse } from '@angular/common/http';

function serverMessage(err: HttpErrorResponse): string | null {
  const body = err.error as { message?: unknown } | null;
  if (body && typeof body.message === 'string' && body.message.trim()) {
    return body.message;
  }
  if (typeof err.message === 'string' && err.message !== 'Http failure response' && !String(err.message).startsWith('Http failure')) {
    return err.message;
  }
  return null;
}

/** Turns an API/network failure into a short, descriptive, human-friendly message. */
export function toErrorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    const specific = serverMessage(err);
    switch (err.status) {
      case 0:
        return "Can't reach the server right now. Check your connection and try again.";
      case 400:
        return specific ?? 'That request couldn\'t be processed. Check what you entered and try again.';
      case 401:
      case 403:
        return 'Your session has expired. Refresh the page and sign in again.';
      case 404:
        return 'That item no longer exists. It may have been deleted on another device.';
      case 413:
        return 'That image is too large to save — choose a smaller or more compressed photo.';
      case 429:
        return 'Too many requests — wait a moment and try again.';
      case 500:
      case 502:
      case 503:
      case 504:
        return 'Something went wrong on the server. Please try again in a moment.';
      default:
        return specific ?? 'Something went wrong while saving. Please try again.';
    }
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return 'Something went wrong. Please try again.';
}