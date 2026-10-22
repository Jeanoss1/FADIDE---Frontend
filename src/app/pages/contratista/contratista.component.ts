import { Component, computed, effect, inject, signal, untracked, viewChild } from '@angular/core';
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
import { Contratista } from '../../model/contratista';
import { ContratistaService } from '../../services/contratista.service';
import { openConfirm } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  imports: [
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
  selector: 'app-contratista',
  templateUrl: './contratista.component.html',
})
export class ContratistaComponent {
  private readonly contratistaService = inject(ContratistaService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  protected $dataSource = signal(new MatTableDataSource<Contratista>());
  protected $paginator = viewChild(MatPaginator);
  protected $sort = viewChild(MatSort);

  protected $contratistas = this.contratistaService.$dataChange;
  protected $canEdit = computed(() => this.authService.hasRole('ADMIN', 'GESTOR'));
  protected $displayedColumns = computed(() => {
    const cols = ['nombre', 'ruc'];
    return this.$canEdit() ? [...cols, 'actions'] : cols;
  });

  constructor() {
    this.contratistaService.findAll().subscribe(data => this.contratistaService.setDataChange(data));

    effect(() => {
      const ds = this.$dataSource();
      ds.data = this.$contratistas();
      ds.paginator = this.$paginator();
      ds.sort = this.$sort();
    });

    effect(() => {
      const message = this.contratistaService.$messageChange();
      if (message) {
        this.snackBar.open(message, 'OK', { duration: 2500, horizontalPosition: 'right', verticalPosition: 'top', panelClass: 'snack-ok' });
        untracked(() => this.contratistaService.setMessageChange(''));
      }
    });
  }

  applyFilter(e: Event) {
    const filterValue = (e.target as HTMLInputElement).value;
    this.$dataSource().filter = filterValue.trim().toLowerCase();
  }

  delete(contratista: Contratista) {
    openConfirm(this.dialog, {
      title: 'Eliminar contratista',
      message: `¿Seguro que deseas eliminar a "${contratista.nombre}"?`
    }).pipe(
      filter(Boolean),
      switchMap(() => this.contratistaService.delete(contratista.idContratista)),
      switchMap(() => this.contratistaService.findAll()),
      tap(data => this.contratistaService.setDataChange(data)),
      tap(() => this.contratistaService.setMessageChange('Contratista eliminado'))
    ).subscribe({
      error: err => this.snackBar.open(getErrorMessage(err), 'OK', { duration: 4000, panelClass: 'snack-error' })
    });
  }
}
