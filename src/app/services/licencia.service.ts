import { Service } from '@angular/core';
import { environment } from '../../environments/environment';
import { Licencia } from '../model/licencia';
import { GenericService } from './generic.service';

@Service()
export class LicenciaService extends GenericService<Licencia> {
    constructor() {
        super(`${environment.HOST}/licencias`);
    }

    findPorVencer(dias: number = 30) {
        return this.http.get<Licencia[]>(`${this.url}/por-vencer`, { params: { dias } });
    }
}
