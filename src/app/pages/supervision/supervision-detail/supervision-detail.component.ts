import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { filter, map, switchMap } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { today } from '../../../core/utils/dates';
import { getErrorMessage } from '../../../core/utils/http-error';
import { Evidencia } from '../../../model/evidencia';
import { Observacion } from '../../../model/observacion';
import { Supervision } from '../../../model/supervision';
import { EvidenciaService } from '../../../services/evidencia.service';
import { ObservacionService } from '../../../services/observacion.service';
import { SupervisionService } from '../../../services/supervision.service';
import { openConfirm } from '../../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  imports: [
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTooltipModule,
    RouterLink
  ],
  selector: 'app-supervision-detail',
  styleUrl: './supervision-detail.component.css',
  templateUrl: './supervision-detail.component.html',
})
export class SupervisionDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly supervisionService = inject(SupervisionService);
  private readonly evidenciaService = inject(EvidenciaService);
  private readonly observacionService = inject(ObservacionService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  private readonly $params = toSignal(this.route.params, { initialValue: {} });
  protected $id = computed(() => Number(this.$params()['id']));
  protected $isSupervisor = computed(() => this.authService.hasRole('SUPERVISOR'));

  protected $supervision = signal<Supervision | null>(null);
  protected $evidencias = signal<Evidencia[]>([]);
  protected $observaciones = signal<Observacion[]>([]);
  protected maxDate = today();

  protected evidenciaForm = new FormGroup({
    imagen: new FormControl<string>('', [Validators.required, Validators.maxLength(500)]),
    descripcion: new FormControl<string>('', [Validators.maxLength(1000)]),
    fecha: new FormControl<string>(today(), [Validators.required])
  });

  protected observacionForm = new FormGroup({
    descripcion: new FormControl<string>('', [Validators.required, Validators.maxLength(1000)]),
    fecha: new FormControl<string>(today(), [Validators.required])
  });

  constructor() {
    effect(() => {
      const id = this.$id();
      if (!id) return;
      this.supervisionService.findById(id).subscribe(s => this.$supervision.set(s));
      this.loadEvidencias();
      this.loadObservaciones();
    });
  }

  // El backend lista todas; se filtran las de esta supervisión
  private loadEvidencias() {
    this.evidenciaService.findAll()
      .pipe(map(list => list.filter(e => e.idSupervision === this.$id())))
      .subscribe(data => this.$evidencias.set(data));
  }

  private loadObservaciones() {
    this.observacionService.findAll()
      .pipe(map(list => list.filter(o => o.idSupervision === this.$id())))
      .subscribe(data => this.$observaciones.set(data));
  }

  addEvidencia() {
    if (this.evidenciaForm.invalid) {
      this.evidenciaForm.markAllAsTouched();
      return;
    }
    this.evidenciaService.save({ ...this.evidenciaForm.value, idSupervision: this.$id() }).subscribe({
      next: () => {
        this.evidenciaForm.reset({ fecha: today() });
        this.loadEvidencias();
        this.notify('Evidencia registrada');
      },
      error: err => this.notify(getErrorMessage(err), true)
    });
  }

  addObservacion() {
    if (this.observacionForm.invalid) {
      this.observacionForm.markAllAsTouched();
      return;
    }
    this.observacionService.save({ ...this.observacionForm.value, idSupervision: this.$id() }).subscribe({
      next: () => {
        this.observacionForm.reset({ fecha: today() });
        this.loadObservaciones();
        this.notify('Observación registrada');
      },
      error: err => this.notify(getErrorMessage(err), true)
    });
  }

  deleteEvidencia(e: Evidencia) {
    openConfirm(this.dialog, { title: 'Eliminar evidencia', message: '¿Eliminar esta evidencia fotográfica?' })
      .pipe(filter(Boolean), switchMap(() => this.evidenciaService.delete(e.idEvidencia)))
      .subscribe({
        next: () => { this.loadEvidencias(); this.notify('Evidencia eliminada'); },
        error: err => this.notify(getErrorMessage(err), true)
      });
  }

  deleteObservacion(o: Observacion) {
    openConfirm(this.dialog, { title: 'Eliminar observación', message: '¿Eliminar esta observación?' })
      .pipe(filter(Boolean), switchMap(() => this.observacionService.delete(o.idObservacion)))
      .subscribe({
        next: () => { this.loadObservaciones(); this.notify('Observación eliminada'); },
        error: err => this.notify(getErrorMessage(err), true)
      });
  }

  private notify(message: string, isError = false) {
    this.snackBar.open(message, 'OK', {
      duration: isError ? 4000 : 2500, horizontalPosition: 'right', verticalPosition: 'top',
      panelClass: isError ? 'snack-error' : 'snack-ok'
    });
  }
}
