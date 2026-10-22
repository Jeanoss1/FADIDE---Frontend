import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { switchMap, tap } from 'rxjs';
import { today } from '../../../core/utils/dates';
import { getErrorMessage } from '../../../core/utils/http-error';
import { ESTADOS_PAGO } from '../../../model/pago';
import { ContratoService } from '../../../services/contrato.service';
import { PagoService } from '../../../services/pago.service';
import { EstadoLabelPipe } from '../../../shared/estado.pipe';

// El backend solo permite registrar pagos (GET y POST)
@Component({
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    RouterLink,
    EstadoLabelPipe
  ],
  selector: 'app-pago-edit',
  templateUrl: './pago-edit.component.html',
})
export class PagoEditComponent {
  private readonly router = inject(Router);
  private readonly pagoService = inject(PagoService);
  private readonly snackBar = inject(MatSnackBar);

  protected estados = ESTADOS_PAGO;
  protected $contratos = toSignal(inject(ContratoService).findAll(), { initialValue: [] });

  protected $form = signal(new FormGroup({
    idContrato: new FormControl<number | null>(null, [Validators.required]),
    monto: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
    fechaPago: new FormControl<string>(today(), [Validators.required]),
    estado: new FormControl<string>('REGISTRADO'),
    conformidadEmitida: new FormControl<boolean>(false)
  }));

  save() {
    const form = this.$form();
    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }

    this.pagoService.save(form.value).pipe(
      switchMap(() => this.pagoService.findAll()),
      tap(data => this.pagoService.setDataChange(data)),
      tap(() => this.pagoService.setMessageChange('Pago registrado'))
    ).subscribe({
      next: () => this.router.navigate(['/pages/pago']),
      error: err => this.snackBar.open(getErrorMessage(err), 'OK', { duration: 4000, panelClass: 'snack-error' })
    });
  }
}
