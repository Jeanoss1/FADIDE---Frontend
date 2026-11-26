import { Component, computed, effect, inject, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
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
import { estadoVencimiento } from '../../core/utils/dates';
import { getErrorMessage } from '../../core/utils/http-error';
import { Licencia } from '../../model/licencia';
import { LicenciaService } from '../../services/licencia.service';
import { openConfirm } from '../../shared/confirm-dialog/confirm-dialog.component';
import { PagedList } from '../../shared/paged-list';
import { FiltrosListadoComponent } from '../../shared/filtros-listado/filtros-listado.component';

@Component({
  imports: [
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
    RouterOutlet
  ],
  selector: 'app-licencia',
  templateUrl: './licencia.component.html',
})
export class LicenciaComponent {
  private readonly licenciaService = inject(LicenciaService);
  // Paginación, búsqueda, filtros y orden en el servidor
  protected readonly list = new PagedList(this.licenciaService, { sort: 'fechaVencimiento,asc', sortMap: { nombreProyecto: 'proyecto.nombre' } });
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  protected $licencias = this.licenciaService.$dataChange;
  protected $canEdit = computed(() => this.authService.hasRole('ADMIN', 'GESTOR'));
  protected $displayedColumns = computed(() => {
    const cols = ['numero', 'nombreProyecto', 'fechaEmision', 'fechaVencimiento', 'estado'];
    return this.$canEdit() ? [...cols, 'actions'] : cols;
  });

  protected vencimiento = estadoVencimiento;

  constructor() {
    effect(() => {
      const message = this.licenciaService.$messageChange();
      if (message) {
        this.snackBar.open(message, 'OK', { duration: 2500, horizontalPosition: 'right', verticalPosition: 'top', panelClass: 'snack-ok' });
        untracked(() => this.licenciaService.setMessageChange(''));
      }
    });
  }

  delete(licencia: Licencia) {
    openConfirm(this.dialog, {
      title: 'Eliminar licencia',
      message: `¿Seguro que deseas eliminar la licencia N° ${licencia.numero}?`
    }).pipe(
      filter(Boolean),
      switchMap(() => this.licenciaService.delete(licencia.idLicencia)),
      tap(() => this.licenciaService.requestReload()),
      tap(() => this.licenciaService.setMessageChange('Licencia eliminada'))
    ).subscribe({
      error: err => this.snackBar.open(getErrorMessage(err), 'OK', { duration: 4000, panelClass: 'snack-error' })
    });
  }
}
