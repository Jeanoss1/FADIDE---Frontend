import { AfterViewInit, Component, ElementRef, inject, NgZone, signal, viewChild } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { getErrorMessage } from '../../core/utils/http-error';

// Objeto global que expone el script de Google Identity Services (index.html)
declare const google: any;

// Botón "Continuar con Google": inicia sesión o, si es la primera vez, pide el RUC y crea la cuenta
@Component({
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule],
  selector: 'app-google-button',
  templateUrl: './google-button.component.html',
  styleUrl: './google-button.component.css',
})
export class GoogleButtonComponent implements AfterViewInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly zone = inject(NgZone);

  protected $container = viewChild<ElementRef<HTMLElement>>('googleBtn');
  protected configured = !environment.GOOGLE_CLIENT_ID.startsWith('TU_CLIENT_ID');

  protected $credential = signal<string | null>(null);
  protected $needsRuc = signal(false);
  protected $error = signal('');
  protected ruc = new FormControl<string>('', [Validators.required, Validators.pattern(/^\d{11}$/)]);

  ngAfterViewInit() {
    if (this.configured) {
      this.renderButton();
    }
  }

  // El script carga de forma asíncrona: reintenta hasta que esté disponible
  private renderButton(attempt = 0) {
    if (typeof google === 'undefined' || !google.accounts?.id) {
      if (attempt < 50) setTimeout(() => this.renderButton(attempt + 1), 100);
      return;
    }
    google.accounts.id.initialize({
      client_id: environment.GOOGLE_CLIENT_ID,
      callback: (resp: { credential: string }) => this.zone.run(() => this.onCredential(resp.credential)),
    });
    google.accounts.id.renderButton(this.$container()!.nativeElement, {
      theme: 'outline', size: 'large', text: 'continue_with', shape: 'rectangular', width: 360, locale: 'es',
    });
  }

  private onCredential(credential: string) {
    this.$credential.set(credential);
    this.send();
  }

  completeRegistration() {
    if (this.ruc.invalid) {
      this.ruc.markAsTouched();
      return;
    }
    this.send(this.ruc.value);
  }

  private send(documento?: string) {
    this.$error.set('');
    this.authService.loginWithGoogle(this.$credential()!, documento).subscribe({
      next: () => this.router.navigateByUrl(this.authService.homeUrl()),
      error: (err: HttpErrorResponse) => {
        // 428: primer ingreso, el backend necesita el RUC para crear la cuenta
        if (err.status === 428) {
          this.$needsRuc.set(true);
        } else {
          this.$error.set(getErrorMessage(err));
        }
      }
    });
  }
}
