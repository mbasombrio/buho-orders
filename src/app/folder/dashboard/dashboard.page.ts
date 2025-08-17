import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { environment } from '../../../environments/environment';
import { AuthStateService } from '../../services/auth-state.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    RouterModule
  ]
})
export class DashboardPage implements OnInit {
  currentYear = new Date().getFullYear();
  environment = environment;

  // Páginas del menú sidebar
  public appPages = [
    { title: 'Dashboard', url: '/dashboard', icon: 'apps' },
    { title: 'Pedidos', url: '/dashboard/orders', icon: 'cart' },
  ];

  get displayClient(): string {
    if (environment.useMultiClient) {
      const client = localStorage.getItem('client') || 'Plan Nube';
      return client;
    } else {
      return environment.nameMultiClient || 'Plan Nube';
    }
  }

  constructor(
    private router: Router,
    private authStateService: AuthStateService
  ) { }

  ngOnInit() {

  }

  logout() {
    // Limpiar tokens usando el servicio
    this.authStateService.clearAuth();

    // Redirigir a login
    this.router.navigate(['/login']);
  }
}
