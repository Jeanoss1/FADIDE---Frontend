import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { getErrorMessage } from '../../../core/utils/http-error';
import { GoogleButtonComponent } from '../../../shared/google-button/google-button.component';
import { RegisterRequest } from '../../../model/auth';

// La confirmación debe coincidir con la contraseña
function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return password && confirm && password !== confirm ? { mismatch: true } : null;
}

@Component({
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    RouterLink,
    GoogleButtonComponent
  ],
  selector: 'app-register',
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected $form = signal(new FormGroup({
    nombreCompleto: new FormControl<string>('', [Validators.required, Validators.maxLength(150)]),
    documento: new FormControl<string>('', [Validators.required, Validators.pattern(/^\d{11}$/)]),
    correo: new FormControl<string>('', [Validators.required, Validators.email, Validators.maxLength(100)]),
    password: new FormControl<string>('', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]),
    confirmPassword: new FormControl<string>('', [Validators.required])
  }, { validators: passwordsMatch }));

  protected $hidePassword = signal(true);
  protected $loading = signal(false);
  protected $error = signal('');

  register() {
    const form = this.$form();
    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }

    this.$loading.set(true);
    this.$error.set('');

    const { confirmPassword, ...data } = form.getRawValue();

    // El backend guarda el usuario en la BD con rol CLIENTE y devuelve la sesión iniciada
    this.authService.register(data as RegisterRequest).subscribe({
      next: () => this.router.navigateByUrl(this.authService.homeUrl()),
      error: err => {
        this.$error.set(getErrorMessage(err));
        this.$loading.set(false);
      }
    });
  }
}
