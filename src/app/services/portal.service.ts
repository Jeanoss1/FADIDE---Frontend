import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { MiObra } from '../model/mi-obra';

@Service()
export class PortalService {
    protected url: string = `${environment.HOST}/portal`;
    private readonly http = inject(HttpClient);

    findMisObras() {
        return this.http.get<MiObra[]>(`${this.url}/mis-obras`);
    }
}
