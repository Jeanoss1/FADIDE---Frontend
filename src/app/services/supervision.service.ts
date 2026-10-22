import { Service } from '@angular/core';
import { environment } from '../../environments/environment';
import { Supervision } from '../model/supervision';
import { GenericService } from './generic.service';

@Service()
export class SupervisionService extends GenericService<Supervision> {
    constructor() {
        super(`${environment.HOST}/supervisiones`);
    }

    findByContrato(idContrato: number) {
        return this.http.get<Supervision>(`${this.url}/contrato/${idContrato}`);
    }
}
