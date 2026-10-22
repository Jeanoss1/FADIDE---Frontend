export const ESTADOS_PAGO = ['REGISTRADO', 'PENDIENTE', 'PAGADO', 'ANULADO'];

export class Pago {
    idPago: number;
    monto: number;
    fechaPago: string;
    estado: string;
    conformidadEmitida: boolean;
    idContrato: number;
}
