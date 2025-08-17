import { Injectable } from '@angular/core';
import { BasketOrder } from '@models/basket-order';
import { BehaviorSubject, Observable } from 'rxjs';
import { Branch } from '@models/branch';
import { User } from '@models/user';

@Injectable({
  providedIn: 'root'
})
export class SqliteOrdersService {
  private dbName = 'BuhoOrdersDB';
  private dbVersion = 1;
  private storeName = 'orders';
  private db: IDBDatabase | null = null;
  private ordersSubject = new BehaviorSubject<BasketOrder[]>([]);
  private dbInitialized: Promise<void>;

  constructor() {
    this.dbInitialized = this.initDB();
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject(new Error('Error opening database'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.loadOrders().then(() => resolve()).catch(() => resolve());
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('state', 'state', { unique: false });
          store.createIndex('customerId', 'customer.id', { unique: false });
          store.createIndex('open', 'open', { unique: false });
        }
      };
    });
  }

  private async executeTransaction<T>(
    storeName: string,
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest<T>
  ): Promise<T> {
    await this.dbInitialized;
    
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([storeName], mode);
      const store = transaction.objectStore(storeName);
      const request = operation(store);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
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
    await this.dbInitialized;
    
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
    await this.dbInitialized;
    
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readonly');
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
    const count = await this.executeTransaction(
      this.storeName,
      'readonly',
      (store) => store.count()
    );

    return count;
  }

  async loadSampleData(): Promise<void> {
    const sampleOrders: BasketOrder[] = [
      {
        deliveryAmount: 500.0,
        user: {
          id: 1,
          userName: "tom",
          password: "",
          passVerify: "",
          name: "tom",
          email: "",
          cellphone: "",
          role: 1,
          roleDescription: "",
          enabled: true,
          branches: [],
          client: null,
          restrictions: null
        },
        id: 76,
        index: 0,
        type: "Normal",
        open: new Date("Jul 8, 2025 8:03:50 PM"),
        state: "Pending",
        operator: "system",
        customer: {
          customerType: "MINORISTA",
          id: 61,
          dni: "33300556",
          city: "CABA ",
          name: "Matias",
          lastName: "Basombrio",
          email: "m@gmail.com",
          cellphone: "1140792077",
          address: "Fernandez Blanco 2027",
          zipCode: "1431",
          checkingAccountEnabled: false,
          password: "",
          branch: new Branch(),
          enabled: true,
          district: "Villa Urquiza",
          state: "BS aS",
          saldoFavor: 0.0,
          listPrice: 3,
          ivaSituation: "CONSUMIDOR_FINAL",
          ctaCteLimitAmount: 0,
          status: ""
        },
        customerDelivery: {
          id: 73,
          city: "CABA ",
          name: "Matias",
          lastName: "Basombrio",
          email: "m@gmail.com",
          cellphone: "1140792077",
          address: "Fernandez Blanco 2027",
          zipCode: "1431",
          state: "BS aS"
        },
        items: [],
        totalAmount: 27432375,
        branch: {
          id: 1,
          businessName: "Default",
          address: "",
          locality: "",
          contact: "",
          contactPhone: "",
          contactEmail: "",
          alternativeContactEmail: "",
          afipCondition: "",
          responsible: "",
          cuit: "",
          deposits: []
        },
        send: "",
        payment: "",
        paymentStatus: "",
        observation: ""
      },
      {
        deliveryAmount: 0.0,
        user: {
          id: 1,
          userName: "tom",
          password: "",
          passVerify: "",
          name: "tom",
          email: "",
          cellphone: "",
          role: 1,
          roleDescription: "",
          enabled: true,
          branches: [],
          client: null,
          restrictions: null
        },
        id: 75,
        index: 0,
        type: "Normal",
        open: new Date("Jun 28, 2025 1:28:34 PM"),
        state: "Pending",
        operator: "system",
        customer: {
          customerType: "MINORISTA",
          id: 61,
          dni: "33300556",
          city: "CABA ",
          name: "Matias",
          lastName: "Basombrio",
          email: "m@gmail.com",
          cellphone: "1140792077",
          address: "Fernandez Blanco 2027",
          zipCode: "1431",
          checkingAccountEnabled: false,
          password: "",
          branch: new Branch(),
          enabled: true,
          district: "Villa Urquiza",
          state: "BS aS",
          saldoFavor: 0.0,
          listPrice: 3,
          ivaSituation: "CONSUMIDOR_FINAL",
          ctaCteLimitAmount: 0,
          status: ""
        },
        customerDelivery: {
          id: 72,
          city: "CABA ",
          name: "Matias",
          lastName: "Basombrio",
          email: "m@gmail.com",
          cellphone: "1140792077",
          address: "",
          zipCode: "",
          state: "BS aS"
        },
        items: [],
        totalAmount: 901566046,
        branch: {
          id: 2,
          businessName: "Sucursal Centro",
          address: "",
          locality: "",
          contact: "",
          contactPhone: "",
          contactEmail: "",
          alternativeContactEmail: "",
          afipCondition: "",
          responsible: "",
          cuit: "",
          deposits: []
        },
        send: "",
        payment: "",
        paymentStatus: "",
        observation: ""
      }
    ];

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
      if (!this.db) {
        console.warn('Database not ready, skipping initial load');
        return;
      }
      
      const orders = await this.executeTransaction(
        this.storeName,
        'readonly',
        (store) => store.getAll()
      );
      
      this.ordersSubject.next(orders || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      this.ordersSubject.next([]);
    }
  }
}