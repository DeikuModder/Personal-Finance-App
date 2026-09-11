import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../auth/auth.service';

/**
 * Grants access only when a server-validated session exists. On every fresh
 * entry the cookie is checked via /me (an expired access token is silently
 * refreshed by the auth interceptor before the retry).
 */
export const authGuard: CanActivateFn = async (_route, state): Promise<boolean | UrlTree> => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.me()) {
    return true;
  }
  const ok = await auth.restoreSession();
  if (ok) {
    return true;
  }
  return router.createUrlTree(['/login'], { queryParams: { return: state.url } });
};

/** Restricts /login to guests: a valid session skips the login page. */
export const guestGuard: CanActivateFn = async (route): Promise<boolean | UrlTree> => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.me()) {
    const returnUrl = route.queryParamMap.get('return');
    return router.createUrlTree([returnUrl || '/']);
  }
  const ok = await auth.restoreSession();
  if (ok) {
    const returnUrl = route.queryParamMap.get('return');
    return router.createUrlTree([returnUrl || '/']);
  }
  return true;
};