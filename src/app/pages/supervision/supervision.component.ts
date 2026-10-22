import { Component, computed, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
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
import { getErrorMessage } from '../../core/utils/http-error';
import { Supervision } from '../../model/supervision';
import { SupervisionService } from '../../services/supervision.service';
import { openConfirm } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  imports: [
    DatePipe,
    DecimalPipe,
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
  selector: 'app-supervision',
  templateUrl: './supervision.component.html',
})
export class SupervisionComponent {
  private readonly supervisionService = inject(SupervisionService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  protected $dataSource = signal(new MatTableDataSource<Supervision>());
  protected $paginator = viewChild(MatPaginator);
  protected $sort = viewChild(MatSort);

  protected $supervisiones = this.supervisionService.$dataChange;
  // Solo el supervisor registra y modifica la bitácora (regla del backend)
  protected $isSupervisor = computed(() => this.authService.hasRole('SUPERVISOR'));
  protected displayedColumns = ['fecha', 'numeroContrato', 'avance', 'descripcion', 'actions'];

  constructor() {
    this.supervisionService.findAll().subscribe(data => this.supervisionService.setDataChange(data));

    effect(() => {
      const ds = this.$dataSource();
      ds.data = this.$supervisiones();
      ds.paginator = this.$paginator();
      ds.sort = this.$sort();
    });

    effect(() => {
      const message = this.supervisionService.$messageChange();
      if (message) {
        this.snackBar.open(message, 'OK', { duration: 2500, horizontalPosition: 'right', verticalPosition: 'top', panelClass: 'snack-ok' });
        untracked(() => this.supervisionService.setMessageChange(''));
      }
    });
  }

  applyFilter(e: Event) {
    const filterValue = (e.target as HTMLInputElement).value;
    this.$dataSource().filter = filterValue.trim().toLowerCase();
  }

  delete(supervision: Supervision) {
    openConfirm(this.dialog, {
      title: 'Eliminar supervisión',
      message: `¿Seguro que deseas eliminar la supervisión del contrato ${supervision.numeroContrato}?`
    }).pipe(
      filter(Boolean),
      switchMap(() => this.supervisionService.delete(supervision.idSupervision)),
      switchMap(() => this.supervisionService.findAll()),
      tap(data => this.supervisionService.setDataChange(data)),
      tap(() => this.supervisionService.setMessageChange('Supervisión eliminada'))
    ).subscribe({
      error: err => this.snackBar.open(getErrorMessage(err), 'OK', { duration: 4000, panelClass: 'snack-error' })
    });
  }
}
