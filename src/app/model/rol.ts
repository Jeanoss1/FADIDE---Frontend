export type RolNombre = 'ADMIN' | 'GESTOR' | 'SUPERVISOR' | 'CLIENTE';

export class Rol {
    idRol: number;
    nombre: RolNombre;
}
