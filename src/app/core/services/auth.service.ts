import { computed, inject, Service, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, RegisterRequest, Session } from '../../model/auth';
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

    readonly $session = this._session.asReadonly();
    readonly $isLoggedIn = computed(() => !!this._session());
    readonly $rol = computed(() => this._session()?.rol ?? null);

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

    logout() {
        localStorage.removeItem(STORAGE_KEY);
        this._session.set(null);
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
        try {
            const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(atob(base64));
            return !payload.exp || payload.exp * 1000 < Date.now();
        } catch {
            return true;
        }
    }
}
