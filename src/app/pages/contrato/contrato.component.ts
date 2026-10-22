import { Component, computed, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CurrencyPipe, DatePipe } from '@angular/common';
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
import { diasHasta } from '../../core/utils/dates';
import { getErrorMessage } from '../../core/utils/http-error';
import { Contrato } from '../../model/contrato';
import { ContratoService } from '../../services/contrato.service';
import { ProyectoService } from '../../services/proyecto.service';
import { openConfirm } from '../../shared/confirm-dialog/confirm-dialog.component';
import { EstadoClassPipe, EstadoLabelPipe } from '../../shared/estado.pipe';

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
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  private readonly $proyectos = toSignal(inject(ProyectoService).findAll(), { initialValue: [] });
  // idProyecto -> nombre, para mostrar la obra en la tabla
  protected $nombreObra = computed(() => new Map(this.$proyectos().map(p => [p.idProyecto, p.nombre])));

  protected $dataSource = signal(new MatTableDataSource<Contrato>());
  protected $paginator = viewChild(MatPaginator);
  protected $sort = viewChild(MatSort);

  protected $contratos = this.contratoService.$dataChange;
  protected $canEdit = computed(() => this.authService.hasRole('ADMIN', 'GESTOR'));
  protected displayedColumns = ['numeroContrato', 'obra', 'fechaInicio', 'fechaFin', 'montoTotal', 'estado', 'actions'];

  constructor() {
    this.contratoService.findAll().subscribe(data => this.contratoService.setDataChange(data));

    effect(() => {
      const ds = this.$dataSource();
      const obras = this.$nombreObra();
      ds.filterPredicate = (c, f) =>
        [c.numeroContrato, c.estado, obras.get(c.idProyecto)].join(' ').toLowerCase().includes(f);
      ds.data = this.$contratos();
      ds.paginator = this.$paginator();
      ds.sort = this.$sort();
    });

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

  applyFilter(e: Event) {
    const filterValue = (e.target as HTMLInputElement).value;
    this.$dataSource().filter = filterValue.trim().toLowerCase();
  }

  delete(contrato: Contrato) {
    openConfirm(this.dialog, {
      title: 'Eliminar contrato',
      message: `¿Seguro que deseas eliminar el contrato ${contrato.numeroContrato}?`
    }).pipe(
      filter(Boolean),
      switchMap(() => this.contratoService.delete(contrato.idContrato)),
      switchMap(() => this.contratoService.findAll()),
      tap(data => this.contratoService.setDataChange(data)),
      tap(() => this.contratoService.setMessageChange('Contrato eliminado'))
    ).subscribe({
      error: err => this.snackBar.open(getErrorMessage(err), 'OK', { duration: 4000, panelClass: 'snack-error' })
    });
  }
}
