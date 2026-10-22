import { Service } from '@angular/core';
import { environment } from '../../environments/environment';
import { Penalidad } from '../model/penalidad';
import { GenericService } from './generic.service';

@Service()
export class PenalidadService extends GenericService<Penalidad> {
    constructor() {
        super(`${environment.HOST}/penalidades`);
    }
}
