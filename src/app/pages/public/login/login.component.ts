import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { getErrorMessage } from '../../../core/utils/http-error';
import { GoogleButtonComponent } from '../../../shared/google-button/google-button.component';
import { LoginRequest } from '../../../model/auth';
import { AppValidators, errorMessage } from '../../../shared/validators';

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
  selector: 'app-login',
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected $form = signal(new FormGroup({
    correo: new FormControl<string>('', [Validators.required, AppValidators.notBlank, Validators.email, Validators.maxLength(100)]),
    password: new FormControl<string>('', [Validators.required, Validators.minLength(6), Validators.maxLength(72)])
  }));

  // Mensaje del primer error de cada campo (validación del lado del frontend)
  protected errorMessage = errorMessage;

  protected $hidePassword = signal(true);
  protected $loading = signal(false);
  protected $error = signal('');

  login() {
    const form = this.$form();
    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }

    this.$loading.set(true);
    this.$error.set('');

    const credentials: LoginRequest = {
      correo: form.value.correo!.trim().toLowerCase(),
      password: form.value.password!
    };

    this.authService.login(credentials).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        this.router.navigateByUrl(returnUrl || this.authService.homeUrl());
      },
      error: err => {
        this.$error.set(getErrorMessage(err));
        this.$loading.set(false);
      }
    });
  }
}
