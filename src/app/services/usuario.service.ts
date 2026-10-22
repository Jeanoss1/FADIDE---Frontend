import { Service } from '@angular/core';
import { environment } from '../../environments/environment';
import { Usuario } from '../model/usuario';
import { GenericService } from './generic.service';

@Service()
export class UsuarioService extends GenericService<Usuario> {
    constructor() {
        super(`${environment.HOST}/usuarios`);
    }
}
