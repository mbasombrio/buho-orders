import { Injectable } from '@angular/core';
import { BasketOrder } from '@models/basket-order';
import { BehaviorSubject, Observable } from 'rxjs';
import { Branch } from '@models/branch';
import { IndexedDbService } from './database.service';

@Injectable({
  providedIn: 'root'
})
export class SqliteOrdersService {
  private storeName = 'orders';
  private db: IDBDatabase | null = null;
  private ordersSubject = new BehaviorSubject<BasketOrder[]>([]);

  constructor(private indexedDbService: IndexedDbService) {
    this.init();
  }

  private async init(): Promise<void> {
    this.db = await this.indexedDbService.getDb();
    this.loadOrders();
  }

  private async executeTransaction<T>(
    storeName: string,
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest<T>
  ): Promise<T> {
    const db = await this.indexedDbService.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], mode);
      const store = transaction.objectStore(storeName);
      const request = operation(store);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async createOrder(order: BasketOrder): Promise<BasketOrder> {
    const orderToSave = {
      ...order,
      id: order.id || Date.now(),
      open: new Date()
    };

    await this.executeTransaction(
      this.storeName,
      'readwrite',
      (store) => store.add(orderToSave)
    );

    await this.loadOrders();
    return orderToSave;
  }

  async getOrders(): Promise<BasketOrder[]> {
    const orders = await this.executeTransaction(
      this.storeName,
      'readonly',
      (store) => store.getAll()
    );
    return orders || [];
  }

  getOrdersObservable(): Observable<BasketOrder[]> {
    return this.ordersSubject.asObservable();
  }

  async getOrderById(id: number): Promise<BasketOrder | null> {
    const order = await this.executeTransaction(
      this.storeName,
      'readonly',
      (store) => store.get(id)
    );
    return order || null;
  }

  async updateOrder(order: BasketOrder): Promise<BasketOrder> {
    await this.executeTransaction(
      this.storeName,
      'readwrite',
      (store) => store.put(order)
    );
    await this.loadOrders();
    return order;
  }

  async deleteOrder(id: number): Promise<void> {
    await this.executeTransaction(
      this.storeName,
      'readwrite',
      (store) => store.delete(id)
    );
    await this.loadOrders();
  }

  async getOrdersByState(state: string): Promise<BasketOrder[]> {
    const db = await this.indexedDbService.getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('state');
      const request = index.getAll(state);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getOrdersByCustomerId(customerId: number): Promise<BasketOrder[]> {
    const allOrders = await this.getOrders();
    return allOrders.filter(order => order.customer.id === customerId);
  }

  async searchOrdersByCustomerName(name: string): Promise<BasketOrder[]> {
    const allOrders = await this.getOrders();
    const searchTerm = name.toLowerCase();
    return allOrders.filter(order =>
      (order.customer.name?.toLowerCase().includes(searchTerm)) ||
      (order.customer.lastName?.toLowerCase().includes(searchTerm))
    );
  }

  async clearAllOrders(): Promise<void> {
    await this.executeTransaction(
      this.storeName,
      'readwrite',
      (store) => store.clear()
    );
    await this.loadOrders();
  }

  async getOrdersCount(): Promise<number> {
    return await this.executeTransaction(
      this.storeName,
      'readonly',
      (store) => store.count()
    );
  }

  async loadSampleData(): Promise<void> {
    const sampleOrders: BasketOrder[] = []; // Removed for brevity
    for (const order of sampleOrders) {
      try {
        await this.executeTransaction(
          this.storeName,
          'readwrite',
          (store) => store.add(order)
        );
      } catch (error) {
        console.warn('Order already exists:', order.id);
      }
    }
    await this.loadOrders();
  }

  private async loadOrders(): Promise<void> {
    try {
      const orders = await this.getOrders();
      this.ordersSubject.next(orders || []);
    } catch (error) {
      this.ordersSubject.next([]);
    }
  }
}
