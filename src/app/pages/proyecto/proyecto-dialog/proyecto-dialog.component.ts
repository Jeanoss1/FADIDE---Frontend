import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { getErrorMessage } from '../../../core/utils/http-error';
import { ESTADOS_PROYECTO, EstadoProyecto, Proyecto, ProyectoRequest } from '../../../model/proyecto';
import { ClienteService } from '../../../services/cliente.service';
import { ContratistaService } from '../../../services/contratista.service';
import { ProyectoService } from '../../../services/proyecto.service';
import { AppValidators, applyServerErrors, errorMessage } from '../../../shared/validators';

// Formulario de obra en un modal: la obra pertenece a un cliente (FK) y tiene varios contratistas (N:M)
@Component({
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule
  ],
  selector: 'app-proyecto-dialog',
  templateUrl: './proyecto-dialog.component.html',
})
export class ProyectoDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<ProyectoDialogComponent>);
  private readonly proyectoService = inject(ProyectoService);
  protected readonly data = inject<Proyecto | null>(MAT_DIALOG_DATA);

  protected readonly isEdit = !!this.data?.idProyecto;
  protected readonly estados = ESTADOS_PROYECTO;
  protected errorMessage = errorMessage;
  protected $saving = signal(false);
  protected $error = signal('');

  // Combos: clientes y contratistas registrados
  protected $clientes = toSignal(inject(ClienteService).findAll(), { initialValue: [] });
  protected $contratistas = toSignal(inject(ContratistaService).findAll(), { initialValue: [] });

  // La respuesta del backend trae objetos anidados; el formulario trabaja con ids
  protected $form = signal(new FormGroup({
    nombre: new FormControl<string>(this.data?.nombre ?? '',
      [Validators.required, AppValidators.notBlank, Validators.minLength(3), Validators.maxLength(150)]),
    ubicacion: new FormControl<string>(this.data?.ubicacion ?? '',
      [Validators.required, AppValidators.notBlank, Validators.minLength(3), Validators.maxLength(200)]),
    estado: new FormControl<EstadoProyecto>(this.data?.estado ?? 'PLANIFICADO', [Validators.required]),
    idCliente: new FormControl<number | null>(this.data?.cliente?.idCliente ?? null, [Validators.required]),
    idContratistas: new FormControl<number[]>((this.data?.contratistas ?? []).map(c => c.idContratista))
  }));

  save() {
    const form = this.$form();
    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }

    const value = form.getRawValue();
    const body: ProyectoRequest = {
      nombre: value.nombre.trim(),
      ubicacion: value.ubicacion.trim(),
      estado: value.estado,
      idCliente: value.idCliente,
      idContratistas: value.idContratistas ?? []
    };

    this.$saving.set(true);
    this.$error.set('');

    const operation$ = this.isEdit
      ? this.proyectoService.update(this.data!.idProyecto, body)
      : this.proyectoService.save(body);

    operation$.subscribe({
      next: saved => {
        // Mutación silenciosa: solo cambia la fila afectada en el signal de la tabla
        if (this.isEdit) {
          this.proyectoService.replaceLocal(saved, p => p.idProyecto === saved.idProyecto);
        } else {
          this.proyectoService.addLocal(saved);
        }
        this.proyectoService.setMessageChange(this.isEdit ? 'Obra actualizada' : 'Obra registrada');
        this.dialogRef.close(saved);
      },
      error: err => {
        this.$saving.set(false);
        if (!applyServerErrors(form, err)) {
          this.$error.set(getErrorMessage(err));
        }
      }
    });
  }
}
