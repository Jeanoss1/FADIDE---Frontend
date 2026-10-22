import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { switchMap, tap } from 'rxjs';
import { today } from '../../../core/utils/dates';
import { getErrorMessage } from '../../../core/utils/http-error';
import { ContratoService } from '../../../services/contrato.service';
import { SupervisionService } from '../../../services/supervision.service';

@Component({
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSliderModule,
    RouterLink
  ],
  selector: 'app-supervision-edit',
  templateUrl: './supervision-edit.component.html',
})
export class SupervisionEditComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly supervisionService = inject(SupervisionService);
  private readonly snackBar = inject(MatSnackBar);

  protected maxDate = today();
  protected $contratos = toSignal(inject(ContratoService).findAll(), { initialValue: [] });

  protected $form = signal(new FormGroup({
    fecha: new FormControl<string>(today(), [Validators.required]),
    avance: new FormControl<number>(0, [Validators.required, Validators.min(0), Validators.max(100)]),
    descripcion: new FormControl<string>('', [Validators.maxLength(1000)]),
    idContrato: new FormControl<number | null>(null, [Validators.required])
  }));

  private readonly $params = toSignal(this.route.params, { initialValue: {} });
  protected $id = computed(() => this.$params()['id']);
  protected $isEdit = computed(() => !!this.$id());

  constructor() {
    effect(() => {
      const id = this.$id();
      const form = this.$form();
      form.reset({ fecha: today(), avance: 0 });
      if (id) {
        this.supervisionService.findById(id).subscribe(data => form.patchValue(data));
      }
    });
  }

  save() {
    const form = this.$form();
    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }
    if (form.value.fecha > this.maxDate) {
      this.snackBar.open('La fecha no puede ser futura', 'OK', { duration: 3000, panelClass: 'snack-error' });
      return;
    }

    const isEdit = this.$isEdit();
    const operation$ = isEdit
      ? this.supervisionService.update(this.$id(), form.value)
      : this.supervisionService.save(form.value);

    operation$.pipe(
      switchMap(() => this.supervisionService.findAll()),
      tap(data => this.supervisionService.setDataChange(data)),
      tap(() => this.supervisionService.setMessageChange(isEdit ? 'Avance actualizado' : 'Avance registrado'))
    ).subscribe({
      next: () => this.router.navigate(['/pages/supervision']),
      error: err => this.snackBar.open(getErrorMessage(err), 'OK', { duration: 4000, panelClass: 'snack-error' })
    });
  }
}
