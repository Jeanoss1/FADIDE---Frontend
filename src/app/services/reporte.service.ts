import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { environment } from '../../environments/environment';
import { PageQuery } from '../model/page';
import { OpcionId, TablaReporte, TipoReporte } from '../model/reporte';

@Service()
export class ReporteService {
    private readonly http = inject(HttpClient);
    private readonly url = `${environment.HOST}/reportes`;

    vistaPrevia(tipo: TipoReporte, filtros: PageQuery) {
        return this.http.get<TablaReporte>(`${this.url}/${tipo}`, { params: this.params(filtros) });
    }

    // El archivo se pide como Blob para que el interceptor adjunte el token JWT
    exportar(tipo: TipoReporte, formato: 'pdf' | 'excel', filtros: PageQuery) {
        return this.http.get(`${this.url}/${tipo}/exportar`, {
            params: this.params({ ...filtros, formato }),
            responseType: 'blob'
        });
    }

    supervisores() {
        return this.http.get<OpcionId[]>(`${this.url}/supervisores`);
    }

    private params(filtros: PageQuery) {
        let params = new HttpParams();
        for (const [key, value] of Object.entries(filtros)) {
            if (value !== null && value !== undefined && value !== '') {
                params = params.set(key, String(value));
            }
        }
        return params;
    }
}
