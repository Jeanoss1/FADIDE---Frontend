import { Component, computed, effect, inject, untracked } from '@angular/core';
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
import { filter, switchMap } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { getErrorMessage } from '../../core/utils/http-error';
import { Contratista } from '../../model/contratista';
import { ContratistaService } from '../../services/contratista.service';
import { openConfirm } from '../../shared/confirm-dialog/confirm-dialog.component';
import { PagedList } from '../../shared/paged-list';

@Component({
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressBarModule,
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
  // Paginación, búsqueda, filtros y orden en el servidor
  protected readonly list = new PagedList(this.contratistaService, { sort: 'nombre,asc' });
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  protected $contratistas = this.contratistaService.$dataChange;
  protected $canEdit = computed(() => this.authService.hasRole('ADMIN', 'GESTOR'));
  protected $displayedColumns = computed(() => {
    const cols = ['nombre', 'ruc'];
    return this.$canEdit() ? [...cols, 'actions'] : cols;
  });

  constructor() {
    effect(() => {
      const message = this.contratistaService.$messageChange();
      if (message) {
        this.snackBar.open(message, 'OK', { duration: 2500, horizontalPosition: 'right', verticalPosition: 'top', panelClass: 'snack-ok' });
        untracked(() => this.contratistaService.setMessageChange(''));
      }
    });
  }

  delete(contratista: Contratista) {
    openConfirm(this.dialog, {
      title: 'Eliminar contratista',
      message: `¿Seguro que deseas eliminar a "${contratista.nombre}"?`
    }).pipe(
      filter(Boolean),
      switchMap(() => this.contratistaService.delete(contratista.idContratista))
    ).subscribe({
      next: () => {
        // Mutación silenciosa: se quita la fila del signal sin volver a consultar al backend
        this.contratistaService.removeLocal(c => c.idContratista === contratista.idContratista);
        this.contratistaService.setMessageChange('Contratista eliminado');
      },
      error: err => this.snackBar.open(getErrorMessage(err), 'OK', { duration: 4000, panelClass: 'snack-error' })
    });
  }
}
