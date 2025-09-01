import { Injectable } from '@angular/core';
import { Article } from '@models/article';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SqliteArticlesService {
  private dbName = 'articles_db';
  private dbVersion = 1;
  private storeName = 'articles';
  private db: IDBDatabase | null = null;

  private articlesSubject = new BehaviorSubject<Article[]>([]);
  public articles$ = this.articlesSubject.asObservable();

  constructor() {
    this.initDatabase();
  }

  private async initDatabase(): Promise<void> {
    try {
      await this.createDatabase();
    } catch (error) {
      console.error('Error initializing database, attempting to recreate:', error);
      await this.recreateDatabase();
    }
  }

  private async createDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Error opening database');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('Database opened successfully');

        // Verificar que el object store existe
        if (!this.db.objectStoreNames.contains(this.storeName)) {
          console.warn('Object store missing, recreating database');
          this.db.close();
          this.recreateDatabase().then(resolve).catch(reject);
          return;
        }

        this.loadArticles();
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        console.log('Database upgrade needed, creating object store');

        // Eliminar store existente si existe
        if (db.objectStoreNames.contains(this.storeName)) {
          db.deleteObjectStore(this.storeName);
        }

        // Crear nuevo store
        const store = db.createObjectStore(this.storeName, { keyPath: 'sku' });
        store.createIndex('name', 'name', { unique: false });
        store.createIndex('department', 'department.name', { unique: false });
        store.createIndex('unitPrice1', 'unitPrice1', { unique: false });
        store.createIndex('unitInStock', 'unitInStock', { unique: false });

        console.log('Object store and indexes created successfully');
      };
    });
  }

  // Método público para recrear la base de datos
  async recreateDatabase(): Promise<void> {
    console.log('Recreating database...');

    // Cerrar conexión existente si existe
    if (this.db) {
      this.db.close();
      this.db = null;
    }

    // Eliminar base de datos existente
    return new Promise((resolve, reject) => {
      const deleteRequest = indexedDB.deleteDatabase(this.dbName);

      deleteRequest.onerror = () => {
        console.error('Error deleting database');
        reject(deleteRequest.error);
      };

      deleteRequest.onsuccess = () => {
        console.log('Database deleted successfully, creating new one');
        this.createDatabase().then(resolve).catch(reject);
      };

      deleteRequest.onblocked = () => {
        console.warn('Database deletion blocked, retrying...');
        setTimeout(() => {
          this.createDatabase().then(resolve).catch(reject);
        }, 1000);
      };
    });
  }

  // Método para verificar el estado de la base de datos
  async checkDatabaseHealth(): Promise<{ exists: boolean; hasStore: boolean; version: number }> {
    return new Promise((resolve) => {
      const request = indexedDB.open(this.dbName);

      request.onsuccess = () => {
        const db = request.result;
        const result = {
          exists: true,
          hasStore: db.objectStoreNames.contains(this.storeName),
          version: db.version
        };
        db.close();
        resolve(result);
      };

      request.onerror = () => {
        resolve({ exists: false, hasStore: false, version: 0 });
      };
    });
  }

  async createArticle(article: Article): Promise<Article> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.add(article);

      request.onsuccess = () => {
        console.log('Article created successfully');
        this.loadArticles();
        resolve(article);
      };

      request.onerror = () => {
        console.error('Error creating article');
        reject(request.error);
      };
    });
  }

  async getArticles(): Promise<Article[]> {
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
        console.error('Error getting articles');
        reject(request.error);
      };
    });
  }

  getArticlesObservable(): Observable<Article[]> {
    return this.articles$;
  }

  async getArticleBySku(sku: string): Promise<Article | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(sku);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        console.error('Error getting article by SKU');
        reject(request.error);
      };
    });
  }


  async replaceAllArticles(articles: Article[]): Promise<{ success: number; errors: string[] }> {
    const errors: string[] = [];
    let success = 0;

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      transaction.oncomplete = () => {
        console.log(`Replaced all articles: ${success} articles saved successfully`);
        this.loadArticles();
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

        // 2. Luego agregar los nuevos artículos
        articles.forEach((article, index) => {
          if (!article.sku) {
            errors.push(`Artículo ${index + 1}: SKU`);
            return;
          }

          const request = store.add(article);

          request.onsuccess = () => {
            success++;
          };

          request.onerror = () => {
            errors.push(`Error al guardar artículo ${article.sku}: ${request.error}`);
          };
        });
      };

      clearRequest.onerror = () => {
        console.error('Error clearing existing articles');
        reject(clearRequest.error);
      };
    });
  }

  // Mantener el método original para otras operaciones
  async saveMultipleArticles(articles: Article[]): Promise<{ success: number; errors: string[] }> {
    const errors: string[] = [];
    let success = 0;

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      transaction.oncomplete = () => {
        console.log(`Saved ${success} articles successfully`);
        this.loadArticles();
        resolve({ success, errors });
      };

      transaction.onerror = () => {
        console.error('Transaction failed');
        reject(transaction.error);
      };

      articles.forEach((article, index) => {
        if (!article.sku || !article.name) {
          errors.push(`Artículo ${index + 1}: SKU y nombre son requeridos`);
          return;
        }

        const request = store.put(article);

        request.onsuccess = () => {
          success++;
        };

        request.onerror = () => {
          errors.push(`Error al guardar artículo ${article.sku}: ${request.error}`);
        };
      });
    });
  }

  async clearAllArticles(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('All articles cleared');
        this.loadArticles();
        resolve();
      };

      request.onerror = () => {
        console.error('Error clearing articles');
        reject(request.error);
      };
    });
  }

  async getArticlesCount(): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.count();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('Error counting articles');
        reject(request.error);
      };
    });
  }

  async searchArticlesByName(name: string): Promise<Article[]> {
    const allArticles = await this.getArticles();
    return allArticles.filter(article =>
      article.name.toLowerCase().includes(name.toLowerCase())
    );
  }

  private async loadArticles(): Promise<void> {
    try {
      const articles = await this.getArticles();
      this.articlesSubject.next(articles);
    } catch (error) {
      console.error('Error loading articles:', error);
      this.articlesSubject.next([]);
    }
  }
}
