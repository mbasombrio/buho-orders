import { Injectable } from '@angular/core';
import { Article } from '@models/article';
import { BehaviorSubject, Observable } from 'rxjs';
import { IndexedDbService } from './database.service';

@Injectable({
  providedIn: 'root'
})
export class SqliteArticlesService {
  private storeName = 'articles';
  private db: IDBDatabase | null = null;

  private articlesSubject = new BehaviorSubject<Article[]>([]);
  public articles$ = this.articlesSubject.asObservable();

  constructor(private indexedDbService: IndexedDbService) {
    this.initDatabase();
  }

  private async initDatabase(): Promise<void> {
    this.db = await this.indexedDbService.getDb();
    this.loadArticles();
  }

  async recreateDatabase(): Promise<void> {
    await this.indexedDbService.recreateDatabase();
    await this.initDatabase();
  }

  async checkDatabaseHealth(): Promise<{ exists: boolean; hasStore: boolean; version: number }> {
    const health = await this.indexedDbService.checkDatabaseHealth();
    return {
      exists: health.exists,
      hasStore: health.hasArticlesStore,
      version: health.version
    };
  }

  async createArticle(article: Article): Promise<Article> {
    return new Promise(async (resolve, reject) => {
      const db = await this.indexedDbService.getDb();
      const transaction = db.transaction([this.storeName], 'readwrite');
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
    return new Promise(async (resolve, reject) => {
      const db = await this.indexedDbService.getDb();
      const transaction = db.transaction([this.storeName], 'readonly');
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
    return new Promise(async (resolve, reject) => {
      const db = await this.indexedDbService.getDb();
      const transaction = db.transaction([this.storeName], 'readonly');
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

    const db = await this.indexedDbService.getDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
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

      const clearRequest = store.clear();

      clearRequest.onsuccess = () => {
        console.log('All existing articles cleared');

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

  async saveMultipleArticles(articles: Article[]): Promise<{ success: number; errors: string[] }> {
    const errors: string[] = [];
    let success = 0;

    const db = await this.indexedDbService.getDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
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
    return new Promise(async (resolve, reject) => {
      const db = await this.indexedDbService.getDb();
      const transaction = db.transaction([this.storeName], 'readwrite');
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
    return new Promise(async (resolve, reject) => {
      const db = await this.indexedDbService.getDb();
      const transaction = db.transaction([this.storeName], 'readonly');
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
