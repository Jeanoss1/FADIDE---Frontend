import { Service } from '@angular/core';
import { environment } from '../../environments/environment';
import { Pago } from '../model/pago';
import { GenericService } from './generic.service';

@Service()
export class PagoService extends GenericService<Pago> {
    constructor() {
        super(`${environment.HOST}/pagos`);
    }
}
