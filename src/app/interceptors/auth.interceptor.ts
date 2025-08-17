import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs/operators';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  let token: string | null = localStorage.getItem('token');
  token = token && token === 'null' ? null : token;

  // Clonar el request con los headers necesarios
  let modifiedRequest = request.clone({
    setHeaders: {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
      'client': localStorage.getItem('client') || ''
    }
  });

  // Agregar token si existe
  if (token) {
    modifiedRequest = modifiedRequest.clone({
      setHeaders: {
        'jwt-token': token
      }
    });
  }

  return next(modifiedRequest).pipe(
    map((event) => {
      if (event instanceof HttpResponse) {
        if (event.status === 200) {
          const tokenFromResponse = event.headers.get('jwt-token');
          const tokenExpiration = event.headers.get('token-expiration');

          if (tokenFromResponse && tokenExpiration) {
            const timeExpiration: number =
              Number(tokenExpiration) + Number(new Date().getTime());
            localStorage.setItem('token', tokenFromResponse);
            localStorage.setItem('token-expiration', JSON.stringify(timeExpiration));
          }
        }
      }
      return event;
    })
  );
};
