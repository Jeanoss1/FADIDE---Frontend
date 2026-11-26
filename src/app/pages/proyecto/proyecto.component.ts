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
import { filter, switchMap } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { getErrorMessage } from '../../core/utils/http-error';
import { ESTADOS_PROYECTO, Proyecto } from '../../model/proyecto';
import { ProyectoService } from '../../services/proyecto.service';
import { openConfirm } from '../../shared/confirm-dialog/confirm-dialog.component';
import { EstadoClassPipe, EstadoLabelPipe } from '../../shared/estado.pipe';
import { ProyectoDialogComponent } from './proyecto-dialog/proyecto-dialog.component';
import { PagedList } from '../../shared/paged-list';
import { FiltrosListadoComponent, SelectFiltro } from '../../shared/filtros-listado/filtros-listado.component';

@Component({
  imports: [
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
    EstadoClassPipe,
    EstadoLabelPipe
  ],
  selector: 'app-proyecto',
  templateUrl: './proyecto.component.html',
})
export class ProyectoComponent {
  private readonly proyectoService = inject(ProyectoService);
  // Paginación, búsqueda, filtros y orden en el servidor
  protected readonly list = new PagedList(this.proyectoService, { sort: 'nombre,asc', sortMap: { cliente: 'cliente.razonSocial' } });
  protected readonly filtros: SelectFiltro[] = [{ key: 'estado', label: 'Estado', options: ESTADOS_PROYECTO }];
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  protected $proyectos = this.proyectoService.$dataChange;
  protected $canEdit = computed(() => this.authService.hasRole('ADMIN', 'GESTOR'));
  protected $displayedColumns = computed(() => {
    const cols = ['nombre', 'ubicacion', 'cliente', 'contratistas', 'estado'];
    return this.$canEdit() ? [...cols, 'actions'] : cols;
  });

  constructor() {
    effect(() => {
      const message = this.proyectoService.$messageChange();
      if (message) {
        this.snackBar.open(message, 'OK', { duration: 2500, horizontalPosition: 'right', verticalPosition: 'top', panelClass: 'snack-ok' });
        untracked(() => this.proyectoService.setMessageChange(''));
      }
    });
  }

  contratistasText(p: Proyecto): string {
    return (p.contratistas ?? []).map(c => c.nombre).join(', ') || '—';
  }

  // Abre el modal: sin obra = registrar, con obra = editar
  openDialog(proyecto?: Proyecto) {
    this.dialog.open(ProyectoDialogComponent, {
      data: proyecto ?? null,
      width: '720px',
      maxWidth: '95vw',
      disableClose: true
    });
  }

  delete(proyecto: Proyecto) {
    openConfirm(this.dialog, {
      title: 'Eliminar obra',
      message: `¿Seguro que deseas eliminar la obra "${proyecto.nombre}"?`
    }).pipe(
      filter(Boolean),
      switchMap(() => this.proyectoService.delete(proyecto.idProyecto))
    ).subscribe({
      next: () => {
        // Mutación silenciosa: se quita la fila del signal sin recargar la lista
        this.proyectoService.removeLocal(p => p.idProyecto === proyecto.idProyecto);
        this.proyectoService.setMessageChange('Obra eliminada');
      },
      error: err => this.snackBar.open(getErrorMessage(err), 'OK', { duration: 4000, panelClass: 'snack-error' })
    });
  }
}
