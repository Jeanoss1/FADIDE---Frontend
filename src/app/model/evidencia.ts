// IMAGEN, PDF, WORD, EXCEL, POWERPOINT, PLANO y TEXTO son archivos subidos; ENLACE es una URL externa
export type CategoriaEvidencia = 'IMAGEN' | 'PDF' | 'WORD' | 'EXCEL' | 'POWERPOINT' | 'PLANO' | 'TEXTO' | 'ENLACE' | 'ARCHIVO';

export class Evidencia {
    idEvidencia: number;
    // URL externa o, si tieneArchivo, el nombre original del archivo subido
    imagen: string;
    descripcion: string;
    fecha: string;
    idSupervision: number;
    tieneArchivo: boolean;
    categoria: CategoriaEvidencia;
    tipoContenido: string | null;
    tamanoBytes: number | null;
}

// Misma lista blanca que TipoArchivo del backend
export const EXTENSIONES_EVIDENCIA = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'dwg', 'txt', 'csv'];
export const TAMANO_MAXIMO_EVIDENCIA = 10 * 1024 * 1024; // 10 MB

export const ICONO_EVIDENCIA: Record<CategoriaEvidencia, string> = {
    IMAGEN: 'image',
    PDF: 'picture_as_pdf',
    WORD: 'description',
    EXCEL: 'table_chart',
    POWERPOINT: 'slideshow',
    PLANO: 'architecture',
    TEXTO: 'article',
    ENLACE: 'link',
    ARCHIVO: 'attach_file',
};
