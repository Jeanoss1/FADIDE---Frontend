import { Component, computed, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, RouterOutlet } from '@angular/router';
import { filter, switchMap, tap } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { estadoVencimiento } from '../../core/utils/dates';
import { getErrorMessage } from '../../core/utils/http-error';
import { Licencia } from '../../model/licencia';
import { LicenciaService } from '../../services/licencia.service';
import { openConfirm } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  imports: [
    DatePipe,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
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
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  protected $dataSource = signal(new MatTableDataSource<Licencia>());
  protected $paginator = viewChild(MatPaginator);
  protected $sort = viewChild(MatSort);

  protected $licencias = this.licenciaService.$dataChange;
  protected $canEdit = computed(() => this.authService.hasRole('ADMIN', 'GESTOR'));
  protected $displayedColumns = computed(() => {
    const cols = ['numero', 'nombreProyecto', 'fechaEmision', 'fechaVencimiento', 'estado'];
    return this.$canEdit() ? [...cols, 'actions'] : cols;
  });

  protected vencimiento = estadoVencimiento;

  constructor() {
    this.licenciaService.findAll().subscribe(data => this.licenciaService.setDataChange(data));

    effect(() => {
      const ds = this.$dataSource();
      ds.data = this.$licencias();
      ds.paginator = this.$paginator();
      ds.sort = this.$sort();
    });

    effect(() => {
      const message = this.licenciaService.$messageChange();
      if (message) {
        this.snackBar.open(message, 'OK', { duration: 2500, horizontalPosition: 'right', verticalPosition: 'top', panelClass: 'snack-ok' });
        untracked(() => this.licenciaService.setMessageChange(''));
      }
    });
  }

  applyFilter(e: Event) {
    const filterValue = (e.target as HTMLInputElement).value;
    this.$dataSource().filter = filterValue.trim().toLowerCase();
  }

  delete(licencia: Licencia) {
    openConfirm(this.dialog, {
      title: 'Eliminar licencia',
      message: `¿Seguro que deseas eliminar la licencia N° ${licencia.numero}?`
    }).pipe(
      filter(Boolean),
      switchMap(() => this.licenciaService.delete(licencia.idLicencia)),
      switchMap(() => this.licenciaService.findAll()),
      tap(data => this.licenciaService.setDataChange(data)),
      tap(() => this.licenciaService.setMessageChange('Licencia eliminada'))
    ).subscribe({
      error: err => this.snackBar.open(getErrorMessage(err), 'OK', { duration: 4000, panelClass: 'snack-error' })
    });
  }
}
