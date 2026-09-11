import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

export const sessionGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.hasSession()) {
    return router.createUrlTree(['/login']);
  }
  if (!auth.me()) {
    auth.loadMe();
  }
  return true;
};