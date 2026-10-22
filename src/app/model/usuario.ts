export class Usuario {
    idUsuario: number;
    nombreCompleto: string;
    correo: string;
    documento: string;
    activo: boolean;
    idRol: number;
    nombreRol: string;
}

export class UsuarioRequest {
    nombreCompleto: string;
    correo: string;
    documento: string;
    password: string;
    idRol: number;
}
