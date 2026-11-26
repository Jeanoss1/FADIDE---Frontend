import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { environment } from '../../environments/environment';
import { Dashboard } from '../model/dashboard';

@Service()
export class DashboardService {
    private readonly http = inject(HttpClient);
    private readonly url = `${environment.HOST}/dashboard`;

    obtener() {
        return this.http.get<Dashboard>(this.url);
    }
}
