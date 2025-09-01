import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { FolderPage } from './folder/folder.page';
import { authGuard } from './guards/auth.guard';
import { noAuthGuard } from './guards/no-auth.guard';
import { LoginPage } from './login/login.page';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginPage,
    canActivate: [noAuthGuard]
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./folder/dashboard/dashboard.page').then(m => m.DashboardPage),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },
      {
        path: 'home',
        loadComponent: () => import('./folder/home/home.page').then(m => m.HomePage)
      },
      {
        path: 'orders',
        loadComponent: () => import('./folder/orders/orders.page').then(m => m.OrdersPage)
      },
      {
        path: 'data',
        loadComponent: () => import('./folder/articles/articles.page').then(m => m.ArticlesPage)
      },
      {
        path: 'add-order',
        loadComponent: () => import('./folder/add-order/add-order.page').then(m => m.AddOrderPage)
      },
      {
        path: 'folder/:id',
        component: FolderPage
      },
      {
        path: 'test-sqlite',
        loadComponent: () => import('./folder/test-sqlite/test-sqlite.page').then(m => m.TestSqlitePage)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes)
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
