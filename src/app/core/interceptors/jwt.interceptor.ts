import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

// Agrega el token JWT a cada petición hacia el backend y cierra sesión si expira
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const token = authService.getToken();
    const isApi = req.url.startsWith(environment.HOST);
    const isAuth = req.url.startsWith(`${environment.HOST}/auth`);

    const request = token && isApi && !isAuth
        ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
        : req;

    return next(request).pipe(
        catchError((err: HttpErrorResponse) => {
            if (err.status === 401 && !isAuth) {
                authService.logout();
            }
            return throwError(() => err);
        })
    );
};
