import { Component, computed, effect, inject, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, RouterOutlet } from '@angular/router';
import { filter, switchMap, tap } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { diasHasta } from '../../core/utils/dates';
import { getErrorMessage } from '../../core/utils/http-error';
import { Contrato, ESTADOS_CONTRATO } from '../../model/contrato';
import { ContratoService } from '../../services/contrato.service';
import { ProyectoService } from '../../services/proyecto.service';
import { openConfirm } from '../../shared/confirm-dialog/confirm-dialog.component';
import { EstadoClassPipe, EstadoLabelPipe } from '../../shared/estado.pipe';
import { PagedList } from '../../shared/paged-list';
import { FiltrosListadoComponent, SelectFiltro, opcionesDeEstados } from '../../shared/filtros-listado/filtros-listado.component';

const ESTADOS_CERRADOS = ['CONFORME', 'RESUELTO'];

@Component({
  imports: [
    CurrencyPipe,
    DatePipe,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressBarModule,
    FiltrosListadoComponent,
    MatSortModule,
    MatTableModule,
    MatTooltipModule,
    RouterLink,
    RouterOutlet,
    EstadoClassPipe,
    EstadoLabelPipe
  ],
  selector: 'app-contrato',
  templateUrl: './contrato.component.html',
})
export class ContratoComponent {
  private readonly contratoService = inject(ContratoService);
  // Paginación, búsqueda, filtros y orden en el servidor
  protected readonly list = new PagedList(this.contratoService, { sort: 'fechaInicio,desc' });
  protected readonly filtros: SelectFiltro[] = [{ key: 'estado', label: 'Estado', options: opcionesDeEstados(ESTADOS_CONTRATO) }];
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  private readonly $proyectos = toSignal(inject(ProyectoService).findAll(), { initialValue: [] });
  // idProyecto -> nombre, para mostrar la obra en la tabla
  protected $nombreObra = computed(() => new Map(this.$proyectos().map(p => [p.idProyecto, p.nombre])));

  protected $contratos = this.contratoService.$dataChange;
  protected $canEdit = computed(() => this.authService.hasRole('ADMIN', 'GESTOR'));
  protected displayedColumns = ['numeroContrato', 'obra', 'fechaInicio', 'fechaFin', 'montoTotal', 'estado', 'actions'];

  constructor() {
    effect(() => {
      const message = this.contratoService.$messageChange();
      if (message) {
        this.snackBar.open(message, 'OK', { duration: 2500, horizontalPosition: 'right', verticalPosition: 'top', panelClass: 'snack-ok' });
        untracked(() => this.contratoService.setMessageChange(''));
      }
    });
  }

  // Alerta cuando un contrato abierto está a 15 días o menos de su fecha de fin
  alerta(c: Contrato): string | null {
    if (ESTADOS_CERRADOS.includes(c.estado)) return null;
    const dias = diasHasta(c.fechaFin);
    if (dias < 0) return `Plazo vencido hace ${-dias} d`;
    if (dias <= 15) return `Vence en ${dias} d`;
    return null;
  }

  delete(contrato: Contrato) {
    openConfirm(this.dialog, {
      title: 'Eliminar contrato',
      message: `¿Seguro que deseas eliminar el contrato ${contrato.numeroContrato}?`
    }).pipe(
      filter(Boolean),
      switchMap(() => this.contratoService.delete(contrato.idContrato)),
      tap(() => this.contratoService.requestReload()),
      tap(() => this.contratoService.setMessageChange('Contrato eliminado'))
    ).subscribe({
      error: err => this.snackBar.open(getErrorMessage(err), 'OK', { duration: 4000, panelClass: 'snack-error' })
    });
  }
}
