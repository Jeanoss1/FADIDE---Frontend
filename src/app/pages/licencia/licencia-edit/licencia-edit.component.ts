import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { switchMap, tap } from 'rxjs';
import { getErrorMessage } from '../../../core/utils/http-error';
import { LicenciaService } from '../../../services/licencia.service';
import { ProyectoService } from '../../../services/proyecto.service';

// El vencimiento no puede ser anterior a la emisión
function rangoValido(group: AbstractControl): ValidationErrors | null {
  const emision = group.get('fechaEmision')?.value;
  const vencimiento = group.get('fechaVencimiento')?.value;
  return emision && vencimiento && vencimiento < emision ? { rango: true } : null;
}

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
  selector: 'app-licencia-edit',
  templateUrl: './licencia-edit.component.html',
})
export class LicenciaEditComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly licenciaService = inject(LicenciaService);
  private readonly snackBar = inject(MatSnackBar);

  protected $proyectos = toSignal(inject(ProyectoService).findAll(), { initialValue: [] });

  protected $form = signal(new FormGroup({
    numero: new FormControl<string>('', [Validators.required, Validators.maxLength(50)]),
    fechaEmision: new FormControl<string>('', [Validators.required]),
    fechaVencimiento: new FormControl<string>('', [Validators.required]),
    idProyecto: new FormControl<number | null>(null, [Validators.required])
  }, { validators: rangoValido }));

  private readonly $params = toSignal(this.route.params, { initialValue: {} });
  protected $id = computed(() => this.$params()['id']);
  protected $isEdit = computed(() => !!this.$id());

  constructor() {
    effect(() => {
      const id = this.$id();
      const form = this.$form();
      form.reset();
      if (id) {
        this.licenciaService.findById(id).subscribe(data => form.patchValue(data));
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
    const operation$ = isEdit
      ? this.licenciaService.update(this.$id(), form.value)
      : this.licenciaService.save(form.value);

    operation$.pipe(
      switchMap(() => this.licenciaService.findAll()),
      tap(data => this.licenciaService.setDataChange(data)),
      tap(() => this.licenciaService.setMessageChange(isEdit ? 'Licencia actualizada' : 'Licencia registrada'))
    ).subscribe({
      next: () => this.router.navigate(['/pages/licencia']),
      error: err => this.snackBar.open(getErrorMessage(err), 'OK', { duration: 4000, panelClass: 'snack-error' })
    });
  }
}
