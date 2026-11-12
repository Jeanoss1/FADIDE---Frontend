import { computed, inject, Service, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, RegisterRequest, SesionActual, Session } from '../../model/auth';
import { RolNombre } from '../../model/rol';

const STORAGE_KEY = 'sisco_session';

export const ROL_LABEL: Record<RolNombre, string> = {
    ADMIN: 'Administrador',
    GESTOR: 'Gestor',
    SUPERVISOR: 'Supervisor',
    CLIENTE: 'Cliente',
};

@Service()
export class AuthService {
    protected url: string = `${environment.HOST}/auth`;

    private readonly http = inject(HttpClient);
    private readonly router = inject(Router);
    private readonly _session = signal<Session | null>(this.readSession());
    // true cuando el backend confirmó el token con GET /auth/me
    private readonly _verified = signal(false);

    readonly $session = this._session.asReadonly();
    readonly $verified = this._verified.asReadonly();
    readonly $isLoggedIn = computed(() => !!this._session());
    readonly $rol = computed(() => this._session()?.rol ?? null);
    // Fecha de expiración leída del claim "exp" del token
    readonly $expiresAt = computed(() => {
        const token = this._session()?.token;
        const exp = token ? this.readPayload(token)?.exp : null;
        return exp ? new Date(exp * 1000) : null;
    });

    login(credentials: LoginRequest) {
        return this.http.post<Session>(`${this.url}/login`, credentials).pipe(tap(s => this.saveSession(s)));
    }

    register(data: RegisterRequest) {
        return this.http.post<Session>(`${this.url}/register`, data).pipe(tap(s => this.saveSession(s)));
    }

    // credential = ID token de Google; documento (RUC) solo en el primer ingreso
    loginWithGoogle(credential: string, documento?: string) {
        return this.http.post<Session>(`${this.url}/google`, { credential, documento })
            .pipe(tap(s => this.saveSession(s)));
    }

    /**
     * Comprobante de inicio de sesión: pregunta al backend si el token guardado sigue siendo
     * válido (firma, expiración y usuario activo). Se ejecuta al iniciar la aplicación.
     * - 200: actualiza nombre y rol con los datos del servidor (no se confía en localStorage).
     * - 401: el token fue alterado o expiró; el interceptor cierra la sesión.
     */
    verifySession(): Observable<boolean> {
        if (!this._session()) {
            return of(false);
        }
        return this.http.get<SesionActual>(`${this.url}/me`).pipe(
            tap(me => {
                const current = this._session();
                if (current) {
                    this.saveSession({ ...current, correo: me.correo, nombreCompleto: me.nombreCompleto, rol: me.rol });
                }
                this._verified.set(true);
            }),
            map(() => true),
            // Sin conexión no se bloquea el arranque; el 401 ya lo maneja el interceptor
            catchError(() => of(false))
        );
    }

    logout() {
        // Elimina también la cookie HttpOnly en el servidor (el navegador no puede borrarla)
        this.http.post(`${this.url}/logout`, {}).subscribe({ error: () => undefined });
        localStorage.removeItem(STORAGE_KEY);
        this._session.set(null);
        this._verified.set(false);
        this.router.navigate(['/login']);
    }

    getToken(): string | null {
        return this._session()?.token ?? null;
    }

    hasRole(...roles: RolNombre[]): boolean {
        const rol = this.$rol();
        return !!rol && roles.includes(rol);
    }

    // Ruta de inicio según el rol: el cliente va a su portal, el personal al panel
    homeUrl(): string {
        return this.$rol() === 'CLIENTE' ? '/portal' : '/pages/dashboard';
    }

    private saveSession(session: Session) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        this._session.set(session);
        this._verified.set(true);
    }

    private readSession(): Session | null {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            const session: Session = JSON.parse(raw);
            if (this.isExpired(session.token)) {
                localStorage.removeItem(STORAGE_KEY);
                return null;
            }
            return session;
        } catch {
            return null;
        }
    }

    private isExpired(token: string): boolean {
        const exp = this.readPayload(token)?.exp;
        return !exp || exp * 1000 < Date.now();
    }

    // El payload del JWT es Base64URL (no está cifrado): se puede leer, pero solo el backend valida la firma
    private readPayload(token: string): { exp?: number; sub?: string; rol?: string } | null {
        try {
            const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
            return JSON.parse(atob(base64));
        } catch {
            return null;
        }
    }
}
