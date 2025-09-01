import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Observable } from 'rxjs';
import { BasketOrder } from '@models/basket-order';
import { SqliteOrdersService } from './sqlite-orders.service';
import { NativeSqliteService } from './native-sqlite.service';

@Injectable({
  providedIn: 'root'
})
export class IndexedDbService {
  private dbName = 'buho_orders_db';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  private dbInitialized: Promise<void>;

  constructor() {
    this.dbInitialized = this.initDB();
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Error opening database');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('Database opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        console.log('Database upgrade needed');

        if (!db.objectStoreNames.contains('articles')) {
          const articlesStore = db.createObjectStore('articles', { keyPath: 'sku' });
          articlesStore.createIndex('name', 'name', { unique: false });
        }

        if (!db.objectStoreNames.contains('clients')) {
          const clientsStore = db.createObjectStore('clients', { keyPath: 'id' });
          clientsStore.createIndex('name', 'name', { unique: false });
        }

        if (!db.objectStoreNames.contains('orders')) {
          const ordersStore = db.createObjectStore('orders', { keyPath: 'id' });
          ordersStore.createIndex('state', 'state', { unique: false });
          ordersStore.createIndex('customerId', 'customer.id', { unique: false });
        }
      };
    });
  }

  public async getDb(): Promise<IDBDatabase> {
    await this.dbInitialized;
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  async recreateDatabase(): Promise<void> {
    console.log('Recreating database...');
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    return new Promise((resolve, reject) => {
      const deleteRequest = indexedDB.deleteDatabase(this.dbName);
      deleteRequest.onerror = () => {
        console.error('Error deleting database');
        reject(deleteRequest.error);
      };
      deleteRequest.onsuccess = () => {
        console.log('Database deleted successfully, creating new one');
        this.dbInitialized = this.initDB();
        this.dbInitialized.then(resolve).catch(reject);
      };
    });
  }

  async checkDatabaseHealth(): Promise<{ exists: boolean; hasArticlesStore: boolean; hasClientsStore: boolean; hasOrdersStore: boolean; version: number }> {
    return new Promise((resolve) => {
      const request = indexedDB.open(this.dbName);
      request.onsuccess = () => {
        const db = request.result;
        const result = {
          exists: true,
          hasArticlesStore: db.objectStoreNames.contains('articles'),
          hasClientsStore: db.objectStoreNames.contains('clients'),
          hasOrdersStore: db.objectStoreNames.contains('orders'),
          version: db.version
        };
        db.close();
        resolve(result);
      };
      request.onerror = () => {
        resolve({ exists: false, hasArticlesStore: false, hasClientsStore: false, hasOrdersStore: false, version: 0 });
      };
    });
  }
}


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