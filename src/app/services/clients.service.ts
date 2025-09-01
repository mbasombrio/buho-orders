import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, Observable, retry, throwError, timeout } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Customer } from '../models/customer';
import { ResponseDTO } from './../models/response';

@Injectable({
  providedIn: 'root'
})
export class ClientsService {

  private http = inject(HttpClient);
  private service = signal<string>(`${environment.url}customerService`)

  private readonly TIMEOUT_MS = 120000; // 2 minutos
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 2000; // 2 segundos entre reintentos

  getCustomers(): Observable<ResponseDTO<Customer>> {
    return this.http.get<ResponseDTO<Customer>>(`${this.service()}/customersList`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      params: {
        page: '0',
      }
    }).pipe(
      timeout(this.TIMEOUT_MS),
      retry({
        count: this.MAX_RETRIES,
        delay: (error, retryCount) => {
          console.log(`Reintento ${retryCount}/${this.MAX_RETRIES} después de error:`, error);
          if (this.shouldRetry(error)) {
            return new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * retryCount));
          }
          throw error;
        }
      }),
      catchError(this.handleError.bind(this))
    );
  }

  private shouldRetry(error: any): boolean {
    if (error.name === 'TimeoutError') {
      return true;
    }

    if (error instanceof HttpErrorResponse) {
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
      errorMessage = 'Error desconocido al importar clientes.';
    }

    console.error('Error en ClientsService:', error);
    return throwError(() => new Error(errorMessage));
  }
}
