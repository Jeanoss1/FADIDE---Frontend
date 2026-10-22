import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Rol } from '../model/rol';

@Service()
export class RolService {
    protected url: string = `${environment.HOST}/roles`;
    private readonly http = inject(HttpClient);

    findAll() {
        return this.http.get<Rol[]>(this.url);
    }
}
