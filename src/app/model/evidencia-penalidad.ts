import { CategoriaEvidencia } from './evidencia';

// Documento de sustento de una penalidad (acta, informe, carta, foto, hoja de cálculo...)
export class EvidenciaPenalidad {
    idEvidenciaPenalidad: number;
    nombreOriginal: string;
    categoria: CategoriaEvidencia;
    tipoContenido: string;
    tamanoBytes: number;
    descripcion: string | null;
    fecha: string;
    idPenalidad: number;
}
