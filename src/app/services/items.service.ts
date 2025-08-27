import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, retry, timeout, catchError, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Article } from '../models/article';

@Injectable({
  providedIn: 'root'
})
export class ItemsService {

  private http = inject(HttpClient);
  private service = signal<string>(`${environment.url}itemService`)

  // Configuración de timeouts y reintentos
  private readonly TIMEOUT_MS = 120000; // 2 minutos
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 2000; // 2 segundos entre reintentos

  getArticles(): Observable<Article[]> {
    return this.http.get<Article[]>(`${this.service()}/importItems`, {
      // Configuraciones HTTP para grandes datasets
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    }).pipe(
      // Timeout de 2 minutos
      timeout(this.TIMEOUT_MS),
      
      // Reintentar automáticamente en caso de error
      retry({
        count: this.MAX_RETRIES,
        delay: (error, retryCount) => {
          console.log(`Reintento ${retryCount}/${this.MAX_RETRIES} después de error:`, error);
          
          // Solo reintentar en errores de red/timeout, no en errores del servidor
          if (this.shouldRetry(error)) {
            return new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * retryCount));
          }
          
          // Si no debe reintentar, propagar el error
          throw error;
        }
      }),
      
      // Manejo de errores personalizado
      catchError(this.handleError.bind(this))
    );
  }

  // Método para importación por lotes (alternativa)
  getArticlesPaginated(page: number = 0, size: number = 500): Observable<{
    content: Article[];
    totalElements: number;
    totalPages: number;
    last: boolean;
  }> {
    return this.http.get<{
      content: Article[];
      totalElements: number;
      totalPages: number;
      last: boolean;
    }>(`${this.service()}/importItems/paginated`, {
      params: {
        page: page.toString(),
        size: size.toString()
      }
    }).pipe(
      timeout(30000), // Timeout más corto para lotes pequeños
      retry(2),
      catchError(this.handleError.bind(this))
    );
  }

  private shouldRetry(error: any): boolean {
    // Reintentar solo en casos específicos
    if (error.name === 'TimeoutError') {
      return true;
    }
    
    if (error instanceof HttpErrorResponse) {
      // Reintentar en errores de red/servidor temporal
      const retryableStatusCodes = [0, 408, 429, 500, 502, 503, 504];
      return retryableStatusCodes.includes(error.status);
    }
    
    return false;
  }

  private handleError(error: any): Observable<never> {
    let errorMessage: string;
    
    if (error.name === 'TimeoutError') {
      errorMessage = 'La solicitud tardó demasiado tiempo. El servidor puede estar procesando muchos datos.';
    } else if (error instanceof HttpErrorResponse) {
      switch (error.status) {
        case 0:
          errorMessage = 'No se pudo conectar al servidor. Verifica tu conexión a internet.';
          break;
        case 408:
          errorMessage = 'Tiempo de espera agotado. El servidor tardó demasiado en responder.';
          break;
        case 429:
          errorMessage = 'Demasiadas solicitudes. Intenta de nuevo en unos momentos.';
          break;
        case 500:
          errorMessage = 'Error interno del servidor. El servidor puede estar sobrecargado.';
          break;
        case 502:
        case 503:
        case 504:
          errorMessage = 'El servidor no está disponible temporalmente. Intenta más tarde.';
          break;
        default:
          errorMessage = error.error?.message || `Error del servidor: ${error.status}`;
      }
    } else {
      errorMessage = 'Error desconocido al importar artículos.';
    }

    console.error('Error en ItemsService:', error);
    return throwError(() => new Error(errorMessage));
  }
}
