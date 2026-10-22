import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { Contrato } from '../../../model/contrato';
import { Pago } from '../../../model/pago';
import { Penalidad } from '../../../model/penalidad';
import { Proyecto } from '../../../model/proyecto';
import { Supervision } from '../../../model/supervision';
import { ContratoService } from '../../../services/contrato.service';
import { PagoService } from '../../../services/pago.service';
import { PenalidadService } from '../../../services/penalidad.service';
import { ProyectoService } from '../../../services/proyecto.service';
import { SupervisionService } from '../../../services/supervision.service';
import { EstadoClassPipe, EstadoLabelPipe } from '../../../shared/estado.pipe';

// Vista maestro-detalle: el contrato con sus pagos, penalidades y supervisión
@Component({
  imports: [
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    RouterLink,
    EstadoClassPipe,
    EstadoLabelPipe
  ],
  selector: 'app-contrato-detail',
  templateUrl: './contrato-detail.component.html',
})
export class ContratoDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly contratoService = inject(ContratoService);
  private readonly proyectoService = inject(ProyectoService);
  private readonly pagoService = inject(PagoService);
  private readonly penalidadService = inject(PenalidadService);
  private readonly supervisionService = inject(SupervisionService);

  private readonly $params = toSignal(this.route.params, { initialValue: {} });
  protected $id = computed(() => Number(this.$params()['id']));

  protected $contrato = signal<Contrato | null>(null);
  protected $proyecto = signal<Proyecto | null>(null);
  protected $pagos = signal<Pago[]>([]);
  protected $penalidades = signal<Penalidad[]>([]);
  protected $supervision = signal<Supervision | null>(null);
  protected $notFound = signal(false);

  protected $totalPagado = computed(() => this.$pagos().reduce((sum, p) => sum + Number(p.monto), 0));
  protected $saldo = computed(() => Number(this.$contrato()?.montoTotal ?? 0) - this.$totalPagado());

  protected pagoColumns = ['fechaPago', 'monto', 'estado', 'conformidad'];
  protected penalidadColumns = ['fechaAplicacion', 'montoUit', 'motivo', 'estado'];

  constructor() {
    effect(() => {
      const id = this.$id();
      if (!id) return;

      this.contratoService.findById(id).pipe(
        switchMap(contrato => forkJoin({
          contrato: of(contrato),
          proyecto: this.proyectoService.findById(contrato.idProyecto).pipe(catchError(() => of(null))),
          // El backend no filtra por contrato: se filtra aquí
          pagos: this.pagoService.findAll().pipe(map(list => list.filter(p => p.idContrato === id))),
          penalidades: this.penalidadService.findAll().pipe(map(list => list.filter(p => p.idContrato === id))),
          supervision: this.supervisionService.findByContrato(id).pipe(catchError(() => of(null)))
        }))
      ).subscribe({
        next: data => {
          this.$contrato.set(data.contrato);
          this.$proyecto.set(data.proyecto);
          this.$pagos.set(data.pagos);
          this.$penalidades.set(data.penalidades);
          this.$supervision.set(data.supervision);
        },
        error: () => this.$notFound.set(true)
      });
    });
  }
}
