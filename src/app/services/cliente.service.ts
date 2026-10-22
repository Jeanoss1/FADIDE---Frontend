import { Service } from '@angular/core';
import { environment } from '../../environments/environment';
import { Cliente } from '../model/cliente';
import { GenericService } from './generic.service';

@Service()
export class ClienteService extends GenericService<Cliente> {
    constructor() {
        super(`${environment.HOST}/clientes`);
    }
}
