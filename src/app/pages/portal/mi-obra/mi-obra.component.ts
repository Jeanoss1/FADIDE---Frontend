import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { getErrorMessage } from '../../../core/utils/http-error';
import { MiObra } from '../../../model/mi-obra';
import { PortalService } from '../../../services/portal.service';
import { EstadoClassPipe, EstadoLabelPipe } from '../../../shared/estado.pipe';

// Portal del cliente autoregistrado: solo ve sus propias obras
@Component({
  imports: [CurrencyPipe, DatePipe, DecimalPipe, MatButtonModule, MatIconModule, EstadoClassPipe, EstadoLabelPipe],
  selector: 'app-mi-obra',
  templateUrl: './mi-obra.component.html',
})
export class MiObraComponent {
  protected readonly authService = inject(AuthService);

  protected $obras = signal<MiObra[] | null>(null);
  protected $error = signal('');

  constructor() {
    inject(PortalService).findMisObras().subscribe({
      next: data => this.$obras.set(data),
      error: err => this.$error.set(getErrorMessage(err))
    });
  }
}
