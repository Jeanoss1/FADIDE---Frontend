import { Service } from '@angular/core';
import { environment } from '../../environments/environment';
import { Proyecto } from '../model/proyecto';
import { GenericService } from './generic.service';

@Service()
export class ProyectoService extends GenericService<Proyecto> {
    constructor() {
        super(`${environment.HOST}/proyectos`);
    }
}
