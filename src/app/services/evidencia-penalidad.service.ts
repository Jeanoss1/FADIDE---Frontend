import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { EvidenciaPenalidad } from '../model/evidencia-penalidad';

// Evidencias de una penalidad: recurso anidado /api/penalidades/{id}/evidencias
@Service()
export class EvidenciaPenalidadService {
    private readonly http = inject(HttpClient);
    private readonly url = `${environment.HOST}/penalidades`;

    listar(idPenalidad: number) {
        return this.http.get<EvidenciaPenalidad[]>(`${this.url}/${idPenalidad}/evidencias`);
    }

    subir(idPenalidad: number, archivo: File, datos: { descripcion?: string | null; fecha: string }) {
        const form = new FormData();
        form.append('archivo', archivo, archivo.name);
        form.append('fecha', datos.fecha);
        if (datos.descripcion) {
            form.append('descripcion', datos.descripcion);
        }
        return this.http.post<EvidenciaPenalidad>(`${this.url}/${idPenalidad}/evidencias`, form);
    }

    // Con el token del interceptor; llega como Blob
    descargar(idEvidencia: number) {
        return this.http.get(`${this.url}/evidencias/${idEvidencia}/archivo`, { responseType: 'blob' });
    }

    eliminar(idEvidencia: number) {
        return this.http.delete(`${this.url}/evidencias/${idEvidencia}`);
    }
}
