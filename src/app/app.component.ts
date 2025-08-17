import { CommonModule } from '@angular/common';
import { Component, OnInit, effect } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthStateService } from './services/auth-state.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    RouterModule
  ]
})
export class AppComponent implements OnInit {
  // Usar el servicio de estado de autenticación
  isAuthenticated = this.authStateService.isAuthenticated;

  constructor(
    private router: Router,
    private authStateService: AuthStateService
  ) {
    // Effect que reacciona a cambios en el estado de autenticación
    effect(() => {
      const authenticated = this.isAuthenticated();
      console.log('Estado de autenticación cambió:', authenticated);

      if (!authenticated && this.router.url !== '/login') {
        console.log('No autenticado, redirigiendo a login');
        this.router.navigate(['/login']);
      }
    });
  }

  ngOnInit() {
    // Verificar el estado inicial
    this.checkAuthenticationStatus();

    // Escuchar cambios en localStorage (útil si se modifica desde otra pestaña)
    window.addEventListener('storage', (e) => {
      if (e.key === 'jwt-token' || e.key === 'token-expiration') {
        this.authStateService.updateTokenSignal();
      }
    });
  }

  private checkAuthenticationStatus() {
    if (this.isAuthenticated()) {
      // Si está autenticado y está en login, redirigir a la página principal
      if (this.router.url === '/login' || this.router.url === '/') {
        this.router.navigate(['/dashboard']);
      }
    } else {
      // Si no está autenticado, redirigir al login
      this.router.navigate(['/login']);
    }
  }
}
