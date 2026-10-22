import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  imports: [MatButtonModule, MatIconModule, RouterLink],
  selector: 'app-forbidden',
  template: `
    <div class="page">
      <div class="card forbidden">
        <mat-icon>lock</mat-icon>
        <h1>Acceso denegado</h1>
        <p>Tu rol no tiene permisos para ver esta sección.</p>
        <a mat-flat-button class="btn-primary" routerLink="/pages/dashboard">Volver al inicio</a>
      </div>
    </div>
  `,
  styles: `
    .forbidden { max-width: 460px; margin: 40px auto; text-align: center; padding: 40px 24px; }
    .forbidden mat-icon { font-size: 56px; width: 56px; height: 56px; color: var(--fd-orange); }
    .forbidden p { color: var(--fd-muted); margin: 8px 0 20px; }
  `,
})
export class ForbiddenComponent {}
