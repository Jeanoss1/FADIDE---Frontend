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
import { Proyecto } from '../../model/proyecto';
import { ProyectoService } from '../../services/proyecto.service';
import { openConfirm } from '../../shared/confirm-dialog/confirm-dialog.component';
import { EstadoClassPipe, EstadoLabelPipe } from '../../shared/estado.pipe';

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
    RouterOutlet,
    EstadoClassPipe,
    EstadoLabelPipe
  ],
  selector: 'app-proyecto',
  templateUrl: './proyecto.component.html',
})
export class ProyectoComponent {
  private readonly proyectoService = inject(ProyectoService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  protected $dataSource = signal(this.createDataSource());
  protected $paginator = viewChild(MatPaginator);
  protected $sort = viewChild(MatSort);

  protected $proyectos = this.proyectoService.$dataChange;
  protected $canEdit = computed(() => this.authService.hasRole('ADMIN', 'GESTOR'));
  protected $displayedColumns = computed(() => {
    const cols = ['nombre', 'ubicacion', 'cliente', 'contratistas', 'estado'];
    return this.$canEdit() ? [...cols, 'actions'] : cols;
  });

  constructor() {
    this.proyectoService.findAll().subscribe(data => this.proyectoService.setDataChange(data));

    effect(() => {
      const ds = this.$dataSource();
      ds.data = this.$proyectos();
      ds.paginator = this.$paginator();
      ds.sort = this.$sort();
    });

    effect(() => {
      const message = this.proyectoService.$messageChange();
      if (message) {
        this.snackBar.open(message, 'OK', { duration: 2500, horizontalPosition: 'right', verticalPosition: 'top', panelClass: 'snack-ok' });
        untracked(() => this.proyectoService.setMessageChange(''));
      }
    });
  }

  // El proyecto trae objetos anidados (cliente, contratistas): se aplanan para filtrar y ordenar
  private createDataSource() {
    const ds = new MatTableDataSource<Proyecto>();
    ds.filterPredicate = (p, f) =>
      [p.nombre, p.ubicacion, p.estado, p.cliente?.razonSocial, ...(p.contratistas ?? []).map(c => c.nombre)]
        .join(' ').toLowerCase().includes(f);
    ds.sortingDataAccessor = (p, col) => col === 'cliente' ? p.cliente?.razonSocial : (p as any)[col];
    return ds;
  }

  contratistasText(p: Proyecto): string {
    return (p.contratistas ?? []).map(c => c.nombre).join(', ') || '—';
  }

  applyFilter(e: Event) {
    const filterValue = (e.target as HTMLInputElement).value;
    this.$dataSource().filter = filterValue.trim().toLowerCase();
  }

  delete(proyecto: Proyecto) {
    openConfirm(this.dialog, {
      title: 'Eliminar obra',
      message: `¿Seguro que deseas eliminar la obra "${proyecto.nombre}"?`
    }).pipe(
      filter(Boolean),
      switchMap(() => this.proyectoService.delete(proyecto.idProyecto)),
      switchMap(() => this.proyectoService.findAll()),
      tap(data => this.proyectoService.setDataChange(data)),
      tap(() => this.proyectoService.setMessageChange('Obra eliminada'))
    ).subscribe({
      error: err => this.snackBar.open(getErrorMessage(err), 'OK', { duration: 4000, panelClass: 'snack-error' })
    });
  }
}
