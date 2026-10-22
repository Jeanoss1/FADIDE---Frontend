import { Service } from '@angular/core';
import { environment } from '../../environments/environment';
import { Contratista } from '../model/contratista';
import { GenericService } from './generic.service';

@Service()
export class ContratistaService extends GenericService<Contratista> {
    constructor() {
        super(`${environment.HOST}/contratistas`);
    }
}
