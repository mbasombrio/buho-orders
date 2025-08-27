import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { environment } from '../../../environments/environment';
import { Article } from '../../models/article';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule
  ]
})
export class HomePage {
  currentYear = new Date().getFullYear();
  environment = environment;
  router = inject(Router);

  // Estadísticas de artículos
  articlesStats = {
    total: 0,
    available: 0,
    lowStock: 0,
    outOfStock: 0
  };

  recentArticles: Article[] = [];

  get displayClient(): string {
    if (environment.useMultiClient) {
      const client = localStorage.getItem('client') || 'Plan Nube';
      return client;
    } else {
      return environment.nameMultiClient || 'Plan Nube';
    }
  }

  navigateTo(page: string) {
    this.router.navigate([`/dashboard/${page}`]);
  }
}
