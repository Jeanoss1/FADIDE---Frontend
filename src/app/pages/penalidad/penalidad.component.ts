import { Component, computed, effect, inject, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ESTADOS_PENALIDAD, Penalidad } from '../../model/penalidad';
import { ContratoService } from '../../services/contrato.service';
import { PenalidadService } from '../../services/penalidad.service';
import { EstadoClassPipe, EstadoLabelPipe } from '../../shared/estado.pipe';
import { PagedList } from '../../shared/paged-list';
import { FiltrosListadoComponent, SelectFiltro, opcionesDeEstados } from '../../shared/filtros-listado/filtros-listado.component';

@Component({
  imports: [
    DatePipe,
    DecimalPipe,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressBarModule,
    FiltrosListadoComponent,
    MatSortModule,
    MatTableModule,
    RouterLink,
    RouterOutlet,
    EstadoClassPipe,
    EstadoLabelPipe
  ],
  selector: 'app-penalidad',
  templateUrl: './penalidad.component.html',
})
export class PenalidadComponent {
  private readonly penalidadService = inject(PenalidadService);
  // Paginación, búsqueda, filtros y orden en el servidor
  protected readonly list = new PagedList(this.penalidadService, { sort: 'fechaAplicacion,desc' });
  protected readonly filtros: SelectFiltro[] = [{ key: 'estado', label: 'Estado', options: opcionesDeEstados(ESTADOS_PENALIDAD) }];
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);

  private readonly $contratos = toSignal(inject(ContratoService).findAll(), { initialValue: [] });
  protected $numeroContrato = computed(() => new Map(this.$contratos().map(c => [c.idContrato, c.numeroContrato])));

  protected $penalidades = this.penalidadService.$dataChange;
  protected $canEdit = computed(() => this.authService.hasRole('ADMIN', 'GESTOR'));
  protected displayedColumns = ['contrato', 'fechaAplicacion', 'montoUit', 'motivo', 'estado'];

  constructor() {
    effect(() => {
      const message = this.penalidadService.$messageChange();
      if (message) {
        this.snackBar.open(message, 'OK', { duration: 2500, horizontalPosition: 'right', verticalPosition: 'top', panelClass: 'snack-ok' });
        untracked(() => this.penalidadService.setMessageChange(''));
      }
    });
  }
}
