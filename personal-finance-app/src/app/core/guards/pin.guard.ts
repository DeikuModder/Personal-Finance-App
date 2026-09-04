import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PinService } from '../services/pin.service';

export const pinGuard: CanActivateFn = () => {
  const pinService = inject(PinService);
  const router = inject(Router);

  if (!pinService.isPinSet()) {
    return router.createUrlTree(['/auth/setup']);
  }

  const isAuthenticated = sessionStorage.getItem('fintrack_authenticated');
  if (!isAuthenticated) {
    return router.createUrlTree(['/auth/unlock']);
  }

  return true;
};
