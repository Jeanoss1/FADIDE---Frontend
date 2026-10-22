import { Service } from '@angular/core';
import { environment } from '../../environments/environment';
import { Evidencia } from '../model/evidencia';
import { GenericService } from './generic.service';

@Service()
export class EvidenciaService extends GenericService<Evidencia> {
    constructor() {
        super(`${environment.HOST}/evidencias`);
    }
}
