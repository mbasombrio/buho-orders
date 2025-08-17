import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const noAuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = localStorage.getItem(authService.TOKEN_KEY);
  if (token) {
     router.navigate(['/dashboard']);
    return false;
  } else {
    // Redirigir al login si no está autenticado
   return true;

  }
};
