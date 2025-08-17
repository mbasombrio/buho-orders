import { Injectable, computed, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthStateService {
  // Signal para verificar si hay token en localStorage
  private tokenSignal = signal<string | null>(null);

  // Computed signal que determina si está autenticado basado en el token
  isAuthenticated = computed(() => {
    const token = this.tokenSignal();
    if (!token || token === 'null') return false;

    // Verificar también que no haya expirado
    const expiration = localStorage.getItem('token-expiration');
    if (!expiration) return false;

    const expirationTime = parseInt(expiration);
    const now = Date.now();

    return now < expirationTime;
  });

  constructor() {
    // Inicializar el token signal
    this.updateTokenSignal();
  }

  updateTokenSignal() {
    const token = localStorage.getItem('token');
    this.tokenSignal.set(token);
    console.log('Token signal actualizado:', token ? 'Token presente' : 'Sin token');
  }

  clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('token-expiration');
    localStorage.removeItem('identity');
    localStorage.removeItem('client');
    this.updateTokenSignal();
  }
}
