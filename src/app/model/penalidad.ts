export const ESTADOS_PENALIDAD = ['APLICADA', 'CONDONADA', 'PAGADA'];

export class Penalidad {
    idPenalidad: number;
    montoUit: number;
    fechaAplicacion: string;
    motivo: string;
    estado: string;
    idContrato: number;
}
