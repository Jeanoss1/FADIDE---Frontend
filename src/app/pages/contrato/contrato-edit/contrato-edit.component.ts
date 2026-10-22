import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { switchMap, tap } from 'rxjs';
import { getErrorMessage } from '../../../core/utils/http-error';
import { ESTADOS_CONTRATO } from '../../../model/contrato';
import { ContratoService } from '../../../services/contrato.service';
import { ProyectoService } from '../../../services/proyecto.service';
import { EstadoLabelPipe } from '../../../shared/estado.pipe';

// La fecha de fin no puede ser anterior a la de inicio (misma regla que el backend)
function rangoValido(group: AbstractControl): ValidationErrors | null {
  const inicio = group.get('fechaInicio')?.value;
  const fin = group.get('fechaFin')?.value;
  return inicio && fin && fin < inicio ? { rango: true } : null;
}

// El backend solo permite registrar contratos (no tiene PUT), por eso no hay modo edición
@Component({
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    RouterLink,
    EstadoLabelPipe
  ],
  selector: 'app-contrato-edit',
  templateUrl: './contrato-edit.component.html',
})
export class ContratoEditComponent {
  private readonly router = inject(Router);
  private readonly contratoService = inject(ContratoService);
  private readonly snackBar = inject(MatSnackBar);

  protected estados = ESTADOS_CONTRATO;
  protected $proyectos = toSignal(inject(ProyectoService).findAll(), { initialValue: [] });

  protected $form = signal(new FormGroup({
    numeroContrato: new FormControl<string>('', [Validators.required, Validators.maxLength(50)]),
    idProyecto: new FormControl<number | null>(null, [Validators.required]),
    fechaInicio: new FormControl<string>('', [Validators.required]),
    fechaFin: new FormControl<string>('', [Validators.required]),
    montoTotal: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
    estado: new FormControl<string>('VIGENTE')
  }, { validators: rangoValido }));

  save() {
    const form = this.$form();
    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }

    this.contratoService.save(form.value).pipe(
      switchMap(() => this.contratoService.findAll()),
      tap(data => this.contratoService.setDataChange(data)),
      tap(() => this.contratoService.setMessageChange('Contrato registrado'))
    ).subscribe({
      next: () => this.router.navigate(['/pages/contrato']),
      error: err => this.snackBar.open(getErrorMessage(err), 'OK', { duration: 4000, panelClass: 'snack-error' })
    });
  }
}
