import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { getErrorMessage } from '../../../core/utils/http-error';
import { Cliente } from '../../../model/cliente';
import { ClienteService } from '../../../services/cliente.service';
import { AppValidators, applyServerErrors, errorMessage } from '../../../shared/validators';

// Formulario de cliente en un modal (MatDialog): registrar y editar sin salir del listado
@Component({
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule
  ],
  selector: 'app-cliente-dialog',
  templateUrl: './cliente-dialog.component.html',
})
export class ClienteDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<ClienteDialogComponent>);
  private readonly clienteService = inject(ClienteService);
  // null = nuevo; con datos = edición
  protected readonly data = inject<Cliente | null>(MAT_DIALOG_DATA);

  protected readonly isEdit = !!this.data?.idCliente;
  protected errorMessage = errorMessage;
  protected $saving = signal(false);
  protected $error = signal('');

  protected $form = signal(new FormGroup({
    razonSocial: new FormControl<string>(this.data?.razonSocial ?? '',
      [Validators.required, AppValidators.notBlank, Validators.minLength(3), Validators.maxLength(150)]),
    ruc: new FormControl<string>(this.data?.ruc ?? '', [Validators.required, AppValidators.ruc]),
    direccion: new FormControl<string>(this.data?.direccion ?? '', [Validators.maxLength(200)]),
    telefono: new FormControl<string>(this.data?.telefono ?? '', [AppValidators.celular])
  }));

  save() {
    const form = this.$form();
    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }

    const value = form.getRawValue();
    const body = {
      razonSocial: value.razonSocial.trim(),
      ruc: value.ruc,
      direccion: value.direccion?.trim() || null,
      telefono: value.telefono || null
    };

    this.$saving.set(true);
    this.$error.set('');

    const operation$ = this.isEdit
      ? this.clienteService.update(this.data!.idCliente, body)
      : this.clienteService.save(body);

    operation$.subscribe({
      next: saved => {
        // Mutación silenciosa: se actualiza el signal con la respuesta, sin volver a pedir la lista
        if (this.isEdit) {
          this.clienteService.replaceLocal(saved, c => c.idCliente === saved.idCliente);
        } else {
          this.clienteService.addLocal(saved);
        }
        this.clienteService.setMessageChange(this.isEdit ? 'Cliente actualizado' : 'Cliente registrado');
        this.dialogRef.close(saved);
      },
      error: err => {
        this.$saving.set(false);
        // Errores por campo del backend (400) se muestran en cada input; el resto arriba del formulario
        if (!applyServerErrors(form, err)) {
          this.$error.set(getErrorMessage(err));
        }
      }
    });
  }
}
