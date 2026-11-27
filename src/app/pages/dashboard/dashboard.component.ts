import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { catchError, map, of, startWith } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { getErrorMessage } from '../../core/utils/http-error';
import { Dashboard } from '../../model/dashboard';
import { DashboardService } from '../../services/dashboard.service';
import { GraficoComponent } from '../../shared/grafico/grafico.component';
import { ValorPipe } from '../../shared/valor.pipe';

type Estado =
  | { cargando: true; error?: undefined; datos?: undefined }
  | { cargando: false; error: string; datos?: undefined }
  | { cargando: false; error?: undefined; datos: Dashboard };

const SUBTITULOS: Record<string, string> = {
  ADMIN: 'Resumen general de la empresa',
  GESTOR: 'Seguimiento contractual y financiero de las obras',
  SUPERVISOR: 'Tu trabajo de campo y el avance de las obras',
};

// Panel principal: los indicadores y gráficos llegan del backend según el rol del usuario
@Component({
  imports: [DatePipe, MatIconModule, MatProgressBarModule, RouterLink, GraficoComponent, ValorPipe],
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  protected readonly authService = inject(AuthService);

  protected $estado = toSignal(
    inject(DashboardService).obtener().pipe(
      map((datos): Estado => ({ cargando: false, datos })),
      catchError(err => of<Estado>({ cargando: false, error: getErrorMessage(err) })),
      startWith<Estado>({ cargando: true })
    ),
    { requireSync: true }
  );

  protected $subtitulo = computed(() => SUBTITULOS[this.$estado().datos?.rol ?? ''] ?? 'Resumen general de SISCO');
}
