import { Service } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observacion } from '../model/observacion';
import { GenericService } from './generic.service';

@Service()
export class ObservacionService extends GenericService<Observacion> {
    constructor() {
        super(`${environment.HOST}/observaciones`);
    }
}
