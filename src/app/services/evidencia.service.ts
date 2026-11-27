import { Service } from '@angular/core';
import { environment } from '../../environments/environment';
import { Evidencia } from '../model/evidencia';
import { GenericService } from './generic.service';

@Service()
export class EvidenciaService extends GenericService<Evidencia> {
    constructor() {
        super(`${environment.HOST}/evidencias`);
    }

    // Sube un archivo (multipart/form-data): POST /api/evidencias/archivo
    subirArchivo(archivo: File, datos: { descripcion?: string | null; fecha: string; idSupervision: number }) {
        const form = new FormData();
        form.append('archivo', archivo, archivo.name);
        form.append('fecha', datos.fecha);
        form.append('idSupervision', String(datos.idSupervision));
        if (datos.descripcion) {
            form.append('descripcion', datos.descripcion);
        }
        return this.http.post<Evidencia>(`${this.url}/archivo`, form);
    }

    // El archivo se pide con el token (interceptor) y llega como Blob; por eso no se usa un <img src> directo
    descargarArchivo(id: number) {
        return this.http.get(`${this.url}/${id}/archivo`, { responseType: 'blob' });
    }
}
