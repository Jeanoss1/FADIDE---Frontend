import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { switchMap, tap } from 'rxjs';
import { today } from '../../../core/utils/dates';
import { getErrorMessage } from '../../../core/utils/http-error';
import { ESTADOS_PENALIDAD } from '../../../model/penalidad';
import { ContratoService } from '../../../services/contrato.service';
import { PenalidadService } from '../../../services/penalidad.service';
import { EstadoLabelPipe } from '../../../shared/estado.pipe';

// El backend solo permite registrar penalidades (GET y POST)
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
  selector: 'app-penalidad-edit',
  templateUrl: './penalidad-edit.component.html',
})
export class PenalidadEditComponent {
  private readonly router = inject(Router);
  private readonly penalidadService = inject(PenalidadService);
  private readonly snackBar = inject(MatSnackBar);

  protected estados = ESTADOS_PENALIDAD;
  protected $contratos = toSignal(inject(ContratoService).findAll(), { initialValue: [] });

  protected $form = signal(new FormGroup({
    idContrato: new FormControl<number | null>(null, [Validators.required]),
    montoUit: new FormControl<number | null>(null, [Validators.required, Validators.min(0.0001)]),
    fechaAplicacion: new FormControl<string>(today(), [Validators.required]),
    motivo: new FormControl<string>('', [Validators.required, Validators.maxLength(255)]),
    estado: new FormControl<string>('APLICADA')
  }));

  save() {
    const form = this.$form();
    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }

    this.penalidadService.save(form.value).pipe(
      switchMap(() => this.penalidadService.findAll()),
      tap(data => this.penalidadService.setDataChange(data)),
      tap(() => this.penalidadService.setMessageChange('Penalidad aplicada'))
    ).subscribe({
      next: () => this.router.navigate(['/pages/penalidad']),
      error: err => this.snackBar.open(getErrorMessage(err), 'OK', { duration: 4000, panelClass: 'snack-error' })
    });
  }
}
