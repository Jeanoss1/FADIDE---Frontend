export const ESTADOS_CONTRATO = ['VIGENTE', 'EN_EJECUCION', 'SUSPENDIDO', 'CONFORME', 'RESUELTO'];

export class Contrato {
    idContrato: number;
    numeroContrato: string;
    fechaInicio: string;
    fechaFin: string;
    montoTotal: number;
    estado: string;
    idProyecto: number;
}
