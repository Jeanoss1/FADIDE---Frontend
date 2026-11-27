import { Component, computed, effect, inject, untracked } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
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
import { getErrorMessage } from '../../core/utils/http-error';
import { Supervision } from '../../model/supervision';
import { SupervisionService } from '../../services/supervision.service';
import { openConfirm } from '../../shared/confirm-dialog/confirm-dialog.component';
import { PagedList } from '../../shared/paged-list';
import { FiltrosListadoComponent } from '../../shared/filtros-listado/filtros-listado.component';

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
    MatTooltipModule,
    RouterLink,
    RouterOutlet
  ],
  selector: 'app-supervision',
  templateUrl: './supervision.component.html',
})
export class SupervisionComponent {
  private readonly supervisionService = inject(SupervisionService);
  // Paginación, búsqueda, filtros y orden en el servidor
  protected readonly list = new PagedList(this.supervisionService, { sort: 'fechaRegistro,desc', sortMap: { fecha: 'fechaRegistro', avance: 'avancePorcentual', descripcion: 'observaciones', numeroContrato: 'contrato.numeroContrato' } });
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  protected $supervisiones = this.supervisionService.$dataChange;
  // Solo el supervisor registra y modifica la bitácora (regla del backend)
  // Registrar, editar y eliminar trabajo de campo: SUPERVISOR y ADMIN (acceso total)
  protected $canEdit = computed(() => this.authService.hasRole('ADMIN', 'SUPERVISOR'));
  protected displayedColumns = ['fecha', 'numeroContrato', 'avance', 'descripcion', 'actions'];

  constructor() {
    effect(() => {
      const message = this.supervisionService.$messageChange();
      if (message) {
        this.snackBar.open(message, 'OK', { duration: 2500, horizontalPosition: 'right', verticalPosition: 'top', panelClass: 'snack-ok' });
        untracked(() => this.supervisionService.setMessageChange(''));
      }
    });
  }

  delete(supervision: Supervision) {
    openConfirm(this.dialog, {
      title: 'Eliminar supervisión',
      message: `¿Seguro que deseas eliminar la supervisión del contrato ${supervision.numeroContrato}?`
    }).pipe(
      filter(Boolean),
      switchMap(() => this.supervisionService.delete(supervision.idSupervision)),
      tap(() => this.supervisionService.requestReload()),
      tap(() => this.supervisionService.setMessageChange('Supervisión eliminada'))
    ).subscribe({
      error: err => this.snackBar.open(getErrorMessage(err), 'OK', { duration: 4000, panelClass: 'snack-error' })
    });
  }
}
