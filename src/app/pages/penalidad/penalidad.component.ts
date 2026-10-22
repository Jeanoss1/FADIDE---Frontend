import { Component, computed, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Penalidad } from '../../model/penalidad';
import { ContratoService } from '../../services/contrato.service';
import { PenalidadService } from '../../services/penalidad.service';
import { EstadoClassPipe, EstadoLabelPipe } from '../../shared/estado.pipe';

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
    RouterLink,
    RouterOutlet,
    EstadoClassPipe,
    EstadoLabelPipe
  ],
  selector: 'app-penalidad',
  templateUrl: './penalidad.component.html',
})
export class PenalidadComponent {
  private readonly penalidadService = inject(PenalidadService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);

  private readonly $contratos = toSignal(inject(ContratoService).findAll(), { initialValue: [] });
  protected $numeroContrato = computed(() => new Map(this.$contratos().map(c => [c.idContrato, c.numeroContrato])));

  protected $dataSource = signal(new MatTableDataSource<Penalidad>());
  protected $paginator = viewChild(MatPaginator);
  protected $sort = viewChild(MatSort);

  protected $penalidades = this.penalidadService.$dataChange;
  protected $canEdit = computed(() => this.authService.hasRole('ADMIN', 'GESTOR'));
  protected displayedColumns = ['contrato', 'fechaAplicacion', 'montoUit', 'motivo', 'estado'];

  constructor() {
    this.penalidadService.findAll().subscribe(data => this.penalidadService.setDataChange(data));

    effect(() => {
      const ds = this.$dataSource();
      const numeros = this.$numeroContrato();
      ds.filterPredicate = (p, f) => [numeros.get(p.idContrato), p.motivo, p.estado].join(' ').toLowerCase().includes(f);
      ds.data = this.$penalidades();
      ds.paginator = this.$paginator();
      ds.sort = this.$sort();
    });

    effect(() => {
      const message = this.penalidadService.$messageChange();
      if (message) {
        this.snackBar.open(message, 'OK', { duration: 2500, horizontalPosition: 'right', verticalPosition: 'top', panelClass: 'snack-ok' });
        untracked(() => this.penalidadService.setMessageChange(''));
      }
    });
  }

  applyFilter(e: Event) {
    const filterValue = (e.target as HTMLInputElement).value;
    this.$dataSource().filter = filterValue.trim().toLowerCase();
  }
}
