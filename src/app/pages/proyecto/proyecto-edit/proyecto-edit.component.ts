import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { switchMap, tap } from 'rxjs';
import { getErrorMessage } from '../../../core/utils/http-error';
import { ESTADOS_PROYECTO, EstadoProyecto, ProyectoRequest } from '../../../model/proyecto';
import { ClienteService } from '../../../services/cliente.service';
import { ContratistaService } from '../../../services/contratista.service';
import { ProyectoService } from '../../../services/proyecto.service';

@Component({
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    RouterLink
  ],
  selector: 'app-proyecto-edit',
  templateUrl: './proyecto-edit.component.html',
})
export class ProyectoEditComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly proyectoService = inject(ProyectoService);
  private readonly snackBar = inject(MatSnackBar);

  protected estados = ESTADOS_PROYECTO;
  protected $clientes = toSignal(inject(ClienteService).findAll(), { initialValue: [] });
  protected $contratistas = toSignal(inject(ContratistaService).findAll(), { initialValue: [] });

  protected $form = signal(new FormGroup({
    nombre: new FormControl<string>('', [Validators.required, Validators.maxLength(150)]),
    ubicacion: new FormControl<string>('', [Validators.required, Validators.maxLength(200)]),
    estado: new FormControl<EstadoProyecto>('PLANIFICADO'),
    idCliente: new FormControl<number | null>(null, [Validators.required]),
    idContratistas: new FormControl<number[]>([])
  }));

  private readonly $params = toSignal(this.route.params, { initialValue: {} });
  protected $id = computed(() => this.$params()['id']);
  protected $isEdit = computed(() => !!this.$id());

  constructor() {
    effect(() => {
      const id = this.$id();
      const form = this.$form();
      form.reset({ estado: 'PLANIFICADO', idContratistas: [] });
      if (id) {
        // La respuesta trae objetos; el formulario trabaja con ids
        this.proyectoService.findById(id).subscribe(p => form.patchValue({
          nombre: p.nombre,
          ubicacion: p.ubicacion,
          estado: p.estado,
          idCliente: p.cliente?.idCliente,
          idContratistas: (p.contratistas ?? []).map(c => c.idContratista)
        }));
      }
    });
  }

  save() {
    const form = this.$form();
    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }

    const isEdit = this.$isEdit();
    const proyecto = form.value as ProyectoRequest;
    const operation$ = isEdit
      ? this.proyectoService.update(this.$id(), proyecto)
      : this.proyectoService.save(proyecto);

    operation$.pipe(
      switchMap(() => this.proyectoService.findAll()),
      tap(data => this.proyectoService.setDataChange(data)),
      tap(() => this.proyectoService.setMessageChange(isEdit ? 'Obra actualizada' : 'Obra registrada'))
    ).subscribe({
      next: () => this.router.navigate(['/pages/proyecto']),
      error: err => this.snackBar.open(getErrorMessage(err), 'OK', { duration: 4000, panelClass: 'snack-error' })
    });
  }
}
