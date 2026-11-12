import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { getErrorMessage } from '../../../core/utils/http-error';
import { ContratistaService } from '../../../services/contratista.service';
import { AppValidators, applyServerErrors, errorMessage } from '../../../shared/validators';

// Mantiene el patrón de rutas hijas (new / edit/:id) visto en clase para Category
@Component({
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    RouterLink
  ],
  selector: 'app-contratista-edit',
  templateUrl: './contratista-edit.component.html',
})
export class ContratistaEditComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly contratistaService = inject(ContratistaService);
  private readonly snackBar = inject(MatSnackBar);

  protected errorMessage = errorMessage;

  protected $form = signal(new FormGroup({
    nombre: new FormControl<string>('', [Validators.required, AppValidators.notBlank, Validators.minLength(3), Validators.maxLength(150)]),
    ruc: new FormControl<string>('', [Validators.required, AppValidators.ruc])
  }));

  private readonly $params = toSignal(this.route.params, { initialValue: {} });
  protected $id = computed(() => this.$params()['id']);
  protected $isEdit = computed(() => !!this.$id());

  constructor() {
    effect(() => {
      const id = this.$id();
      const form = this.$form();
      form.reset();
      if (id) {
        this.contratistaService.findById(id).subscribe(data => form.patchValue(data));
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
    const id = Number(this.$id());
    const body = { nombre: form.value.nombre!.trim(), ruc: form.value.ruc };
    const operation$ = isEdit
      ? this.contratistaService.update(id, body)
      : this.contratistaService.save(body);

    operation$.subscribe({
      next: saved => {
        // Mutación silenciosa: se actualiza el signal con el registro devuelto (sin findAll)
        if (isEdit) {
          this.contratistaService.replaceLocal(saved, c => c.idContratista === saved.idContratista);
        } else {
          this.contratistaService.addLocal(saved);
        }
        this.contratistaService.setMessageChange(isEdit ? 'Contratista actualizado' : 'Contratista registrado');
        this.router.navigate(['/pages/contratista']);
      },
      error: err => {
        if (!applyServerErrors(form, err)) {
          this.snackBar.open(getErrorMessage(err), 'OK', { duration: 4000, panelClass: 'snack-error' });
        }
      }
    });
  }
}
