import { RolNombre } from './rol';

export class LoginRequest {
    correo: string;
    password: string;
}

export class RegisterRequest {
    nombreCompleto: string;
    correo: string;
    documento: string;
    password: string;
}

// Respuesta de /api/auth/login y /api/auth/register
export class Session {
    token: string;
    tipo: string;
    correo: string;
    nombreCompleto: string;
    rol: RolNombre;
}
