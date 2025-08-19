import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Observable } from 'rxjs';
import { BasketOrder } from '@models/basket-order';
import { SqliteOrdersService } from './sqlite-orders.service';
import { NativeSqliteService } from './native-sqlite.service';

export interface DatabaseService {
  createOrder(order: BasketOrder): Promise<BasketOrder>;
  getOrders(): Promise<BasketOrder[]>;
  getOrdersObservable(): Observable<BasketOrder[]>;
  getOrderById(id: number): Promise<BasketOrder | null>;
  updateOrder(order: BasketOrder): Promise<BasketOrder>;
  deleteOrder(id: number): Promise<void>;
  getOrdersByState(state: string): Promise<BasketOrder[]>;
  getOrdersByCustomerId?(customerId: number): Promise<BasketOrder[]>;
  searchOrdersByCustomerName(name: string): Promise<BasketOrder[]>;
  clearAllOrders(): Promise<void>;
  getOrdersCount(): Promise<number>;
  loadSampleData?(): Promise<void>;
}

@Injectable({
  providedIn: 'root'
})
export class UnifiedDatabaseService implements DatabaseService {
  private activeService: DatabaseService;

  constructor(
    private sqliteOrdersService: SqliteOrdersService,
    private nativeSqliteService: NativeSqliteService
  ) {
    this.activeService = this.selectService();
  }

  private selectService(): DatabaseService {
    if (Capacitor.isNativePlatform()) {
      console.log('Using native SQLite service for mobile platform');
      return this.nativeSqliteService;
    } else {
      console.log('Using IndexedDB service for web platform');
      return this.sqliteOrdersService;
    }
  }

  async createOrder(order: BasketOrder): Promise<BasketOrder> {
    return this.activeService.createOrder(order);
  }

  async getOrders(): Promise<BasketOrder[]> {
    console.log('🎯 UnifiedDatabaseService.getOrders() called');
    console.log('🔧 Active service:', this.getActiveServiceType());
    const result = await this.activeService.getOrders();
    console.log('📋 Service returned:', result);
    return result;
  }

  getOrdersObservable(): Observable<BasketOrder[]> {
    return this.activeService.getOrdersObservable();
  }

  async getOrderById(id: number): Promise<BasketOrder | null> {
    return this.activeService.getOrderById(id);
  }

  async updateOrder(order: BasketOrder): Promise<BasketOrder> {
    return this.activeService.updateOrder(order);
  }

  async deleteOrder(id: number): Promise<void> {
    return this.activeService.deleteOrder(id);
  }

  async getOrdersByState(state: string): Promise<BasketOrder[]> {
    return this.activeService.getOrdersByState(state);
  }

  async getOrdersByCustomerId(customerId: number): Promise<BasketOrder[]> {
    if ('getOrdersByCustomerId' in this.activeService) {
      return this.activeService.getOrdersByCustomerId!(customerId);
    }
    
    const allOrders = await this.getOrders();
    return allOrders.filter(order => order.customer.id === customerId);
  }

  async searchOrdersByCustomerName(name: string): Promise<BasketOrder[]> {
    return this.activeService.searchOrdersByCustomerName(name);
  }

  async clearAllOrders(): Promise<void> {
    return this.activeService.clearAllOrders();
  }

  async getOrdersCount(): Promise<number> {
    return this.activeService.getOrdersCount();
  }

  async loadSampleData(): Promise<void> {
    if ('loadSampleData' in this.activeService) {
      return this.activeService.loadSampleData!();
    }
    console.warn('loadSampleData not available for current platform');
  }

  getActiveServiceType(): string {
    return Capacitor.isNativePlatform() ? 'native-sqlite' : 'indexeddb';
  }

  isNativePlatform(): boolean {
    return Capacitor.isNativePlatform();
  }
}