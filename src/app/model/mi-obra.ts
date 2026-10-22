import { Contrato } from './contrato';
import { Evidencia } from './evidencia';
import { Licencia } from './licencia';
import { Observacion } from './observacion';
import { Proyecto } from './proyecto';
import { Supervision } from './supervision';

export class ContratoAvance {
    contrato: Contrato;
    supervision: Supervision | null;
    evidencias: Evidencia[];
    observaciones: Observacion[];
}

export class MiObra {
    proyecto: Proyecto;
    licencia: Licencia | null;
    contratos: ContratoAvance[];
}
