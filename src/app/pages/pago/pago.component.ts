import { Component, computed, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CurrencyPipe, DatePipe } from '@angular/common';
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
import { Pago } from '../../model/pago';
import { ContratoService } from '../../services/contrato.service';
import { PagoService } from '../../services/pago.service';
import { EstadoClassPipe, EstadoLabelPipe } from '../../shared/estado.pipe';

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
    RouterLink,
    RouterOutlet,
    EstadoClassPipe,
    EstadoLabelPipe
  ],
  selector: 'app-pago',
  templateUrl: './pago.component.html',
})
export class PagoComponent {
  private readonly pagoService = inject(PagoService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);

  private readonly $contratos = toSignal(inject(ContratoService).findAll(), { initialValue: [] });
  protected $numeroContrato = computed(() => new Map(this.$contratos().map(c => [c.idContrato, c.numeroContrato])));

  protected $dataSource = signal(new MatTableDataSource<Pago>());
  protected $paginator = viewChild(MatPaginator);
  protected $sort = viewChild(MatSort);

  protected $pagos = this.pagoService.$dataChange;
  protected $canEdit = computed(() => this.authService.hasRole('ADMIN', 'GESTOR'));
  protected $total = computed(() => this.$pagos().reduce((sum, p) => sum + Number(p.monto), 0));
  protected displayedColumns = ['contrato', 'fechaPago', 'monto', 'estado', 'conformidad'];

  constructor() {
    this.pagoService.findAll().subscribe(data => this.pagoService.setDataChange(data));

    effect(() => {
      const ds = this.$dataSource();
      const numeros = this.$numeroContrato();
      ds.filterPredicate = (p, f) => [numeros.get(p.idContrato), p.estado, p.fechaPago].join(' ').toLowerCase().includes(f);
      ds.data = this.$pagos();
      ds.paginator = this.$paginator();
      ds.sort = this.$sort();
    });

    effect(() => {
      const message = this.pagoService.$messageChange();
      if (message) {
        this.snackBar.open(message, 'OK', { duration: 2500, horizontalPosition: 'right', verticalPosition: 'top', panelClass: 'snack-ok' });
        untracked(() => this.pagoService.setMessageChange(''));
      }
    });
  }

  applyFilter(e: Event) {
    const filterValue = (e.target as HTMLInputElement).value;
    this.$dataSource().filter = filterValue.trim().toLowerCase();
  }
}
