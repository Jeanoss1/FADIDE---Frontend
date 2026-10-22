import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RolNombre } from '../../model/rol';
import { AuthService } from '../services/auth.service';

// Solo deja pasar si hay sesión iniciada
export const authGuard: CanActivateFn = (_route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    return authService.$isLoggedIn()
        ? true
        : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

// Verifica que el rol del usuario esté en data.roles de la ruta
export const roleGuard: CanActivateFn = (route) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const roles = (route.data['roles'] ?? []) as RolNombre[];
    if (roles.length === 0 || authService.hasRole(...roles)) {
        return true;
    }
    return router.createUrlTree([authService.$rol() === 'CLIENTE' ? '/portal' : '/pages/forbidden']);
};

// Login y registro: si ya hay sesión, redirige a su inicio
export const guestGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    return authService.$isLoggedIn() ? router.parseUrl(authService.homeUrl()) : true;
};
