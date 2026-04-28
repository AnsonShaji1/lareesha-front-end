import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { firstValueFrom } from 'rxjs';

export const authGuard = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  try {
    const isAuthenticated = await firstValueFrom(authService.isAuthenticated$);

    if (isAuthenticated) {
      return true;
    }
  } catch {
    // Error getting auth status
  }

  // Not authenticated, redirect to home
  router.navigate(['/']);
  return false;
};
