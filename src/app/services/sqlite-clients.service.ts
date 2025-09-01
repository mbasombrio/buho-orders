import { Injectable } from '@angular/core';
import { Customer } from '@models/customer';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SqliteClientsService {
  private dbName = 'clients_db';
  private dbVersion = 1;
  private storeName = 'clients';
  private db: IDBDatabase | null = null;

    private customersSubject = new BehaviorSubject<Customer[]>([]);
    public customers$ = this.customersSubject.asObservable();

  constructor() {

  }

  // Aquí se implementarán los métodos para interactuar con la base de datos de clientes
  async replaceAllClients(clients: Customer[]): Promise<{ success: number, errors: string[] }> {
    const errors: string[] = [];
    let success = 0;

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      transaction.oncomplete = () => {
        console.log(`Replaced all clients: ${success} clients saved successfully`);
        this.loadCustomers();
        resolve({ success, errors });
      };

      transaction.onerror = () => {
        console.error('Transaction failed');
        reject(transaction.error);
      };

      // 1. Primero limpiar todos los artículos existentes
      const clearRequest = store.clear();

      clearRequest.onsuccess = () => {
        console.log('All existing articles cleared');

        // 2. Luego agregar los nuevos clientes
        clients.forEach((client, index) => {
          if (!client.id) {
            errors.push(`Cliente ${index + 1}: ID`);
            return;
          }

          const request = store.add(client);

          request.onsuccess = () => {
            success++;
          };

          request.onerror = () => {
            errors.push(`Error al guardar cliente ${client.dni}: ${request.error}`);
          };
        });
      };

      clearRequest.onerror = () => {
        console.error('Error clearing existing clients');
        reject(clearRequest.error);
      };
    });
  }




  private async loadCustomers(): Promise<void> {
    try {
      const articles = await this.getCustomers();
      this.customersSubject.next(articles);
    } catch (error) {
      console.error('Error loading customers:', error);
      this.customersSubject.next([]);
    }
  }

   async getCustomers(): Promise<Customer[]> {
      return new Promise((resolve, reject) => {
        if (!this.db) {
          reject(new Error('Database not initialized'));
          return;
        }

        const transaction = this.db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.getAll();

        request.onsuccess = () => {
          const articles = request.result || [];
          console.log('Articles retrieved:', articles.length);
          resolve(articles);
        };

        request.onerror = () => {
          console.error('Error getting customers');
          reject(request.error);
        };
      });
    }
}
