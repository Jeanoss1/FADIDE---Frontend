import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

// Endpoints públicos: no llevan token (login, registro, Google, logout)
const PUBLIC_AUTH = ['/auth/login', '/auth/register', '/auth/google', '/auth/logout'];

/**
 * Propagación del token: intercepta TODAS las peticiones de HttpClient.
 * 1. Si la URL es del backend, agrega "Authorization: Bearer <token>".
 * 2. withCredentials: true permite enviar y recibir la cookie HttpOnly (enfoque alterno).
 * 3. Si el backend responde 401 (token expirado o alterado), cierra la sesión.
 */
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const token = authService.getToken();
    const isApi = req.url.startsWith(environment.HOST);
    const isPublic = PUBLIC_AUTH.some(path => req.url.startsWith(`${environment.HOST}${path}`));

    let request = req;
    if (isApi) {
        request = req.clone({
            withCredentials: true,
            setHeaders: token && !isPublic ? { Authorization: `Bearer ${token}` } : {}
        });
    }

    return next(request).pipe(
        catchError((err: HttpErrorResponse) => {
            if (err.status === 401 && isApi && !isPublic && authService.$isLoggedIn()) {
                authService.logout();
            }
            return throwError(() => err);
        })
    );
};
