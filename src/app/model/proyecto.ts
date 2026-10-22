import { Cliente } from './cliente';
import { Contratista } from './contratista';

export type EstadoProyecto = 'PLANIFICADO' | 'EN_EJECUCION' | 'PAUSADO' | 'FINALIZADO' | 'CANCELADO';

export const ESTADOS_PROYECTO: { value: EstadoProyecto; label: string }[] = [
    { value: 'PLANIFICADO', label: 'Planificado' },
    { value: 'EN_EJECUCION', label: 'En ejecución' },
    { value: 'PAUSADO', label: 'Pausado' },
    { value: 'FINALIZADO', label: 'Finalizado' },
    { value: 'CANCELADO', label: 'Cancelado' },
];

export class Proyecto {
    idProyecto: number;
    nombre: string;
    ubicacion: string;
    estado: EstadoProyecto;
    cliente: Cliente;
    contratistas: Contratista[];
}

// Cuerpo que espera el backend al crear / actualizar
export class ProyectoRequest {
    nombre: string;
    ubicacion: string;
    estado: EstadoProyecto;
    idCliente: number;
    idContratistas: number[];
}
