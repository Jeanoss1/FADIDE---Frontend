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
import { ROL_LABEL } from '../../../core/services/auth.service';
import { getErrorMessage } from '../../../core/utils/http-error';
import { UsuarioRequest } from '../../../model/usuario';
import { RolService } from '../../../services/rol.service';
import { UsuarioService } from '../../../services/usuario.service';

// El backend solo permite crear usuarios (GET y POST)
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
  selector: 'app-usuario-edit',
  templateUrl: './usuario-edit.component.html',
})
export class UsuarioEditComponent {
  private readonly router = inject(Router);
  private readonly usuarioService = inject(UsuarioService);
  private readonly snackBar = inject(MatSnackBar);

  protected rolLabel = ROL_LABEL;
  protected $roles = toSignal(inject(RolService).findAll(), { initialValue: [] });
  protected $hidePassword = signal(true);

  protected $form = signal(new FormGroup({
    nombreCompleto: new FormControl<string>('', [Validators.required, Validators.maxLength(150)]),
    correo: new FormControl<string>('', [Validators.required, Validators.email, Validators.maxLength(100)]),
    documento: new FormControl<string>('', [Validators.required, Validators.pattern(/^\d{8,20}$/)]),
    password: new FormControl<string>('', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]),
    idRol: new FormControl<number | null>(null, [Validators.required])
  }));

  save() {
    const form = this.$form();
    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }

    this.usuarioService.save(form.value as UsuarioRequest).pipe(
      switchMap(() => this.usuarioService.findAll()),
      tap(data => this.usuarioService.setDataChange(data)),
      tap(() => this.usuarioService.setMessageChange('Usuario creado'))
    ).subscribe({
      next: () => this.router.navigate(['/pages/usuario']),
      error: err => this.snackBar.open(getErrorMessage(err), 'OK', { duration: 4000, panelClass: 'snack-error' })
    });
  }
}
