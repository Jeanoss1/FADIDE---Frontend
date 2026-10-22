import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { Contrato } from '../../model/contrato';
import { Licencia } from '../../model/licencia';
import { Proyecto } from '../../model/proyecto';
import { ClienteService } from '../../services/cliente.service';
import { ContratoService } from '../../services/contrato.service';
import { LicenciaService } from '../../services/licencia.service';
import { ProyectoService } from '../../services/proyecto.service';

@Component({
  imports: [DatePipe, MatIconModule, RouterLink],
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  protected readonly authService = inject(AuthService);

  protected $totalClientes = signal(0);
  protected $proyectos = signal<Proyecto[]>([]);
  protected $contratos = signal<Contrato[]>([]);
  protected $porVencer = signal<Licencia[]>([]);

  protected $enEjecucion = computed(() => this.$proyectos().filter(p => p.estado === 'EN_EJECUCION').length);
  protected $vigentes = computed(() => this.$contratos().filter(c => !['CONFORME', 'RESUELTO'].includes(c.estado)).length);

  constructor() {
    forkJoin({
      clientes: inject(ClienteService).findAll().pipe(catchError(() => of([]))),
      proyectos: inject(ProyectoService).findAll().pipe(catchError(() => of([]))),
      contratos: inject(ContratoService).findAll().pipe(catchError(() => of([]))),
      porVencer: inject(LicenciaService).findPorVencer(30).pipe(catchError(() => of([])))
    }).subscribe(d => {
      this.$totalClientes.set(d.clientes.length);
      this.$proyectos.set(d.proyectos);
      this.$contratos.set(d.contratos);
      this.$porVencer.set(d.porVencer);
    });
  }
}
