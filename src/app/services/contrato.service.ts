import { Service } from '@angular/core';
import { environment } from '../../environments/environment';
import { Contrato } from '../model/contrato';
import { GenericService } from './generic.service';

@Service()
export class ContratoService extends GenericService<Contrato> {
    constructor() {
        super(`${environment.HOST}/contratos`);
    }
}
