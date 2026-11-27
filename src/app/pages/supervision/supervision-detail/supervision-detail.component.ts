import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { filter, finalize, map, switchMap } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { today } from '../../../core/utils/dates';
import { getErrorMessage } from '../../../core/utils/http-error';
import { EXTENSIONES_EVIDENCIA, Evidencia, ICONO_EVIDENCIA, TAMANO_MAXIMO_EVIDENCIA } from '../../../model/evidencia';
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
    MatButtonToggleModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
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
  private readonly destroyRef = inject(DestroyRef);

  private readonly $params = toSignal(this.route.params, { initialValue: {} });
  protected $id = computed(() => Number(this.$params()['id']));
  // Registrar, editar y eliminar trabajo de campo: SUPERVISOR y ADMIN (acceso total)
  protected $canEdit = computed(() => this.authService.hasRole('ADMIN', 'SUPERVISOR'));
  // El detalle del contrato es del módulo de gestión: ADMIN y GESTOR
  protected $verContrato = computed(() => this.authService.hasRole('ADMIN', 'GESTOR'));

  protected $supervision = signal<Supervision | null>(null);
  protected $evidencias = signal<Evidencia[]>([]);
  protected $observaciones = signal<Observacion[]>([]);
  protected maxDate = today();

  protected evidenciaForm = new FormGroup({
    imagen: new FormControl<string>('', [Validators.maxLength(500)]),
    descripcion: new FormControl<string>('', [Validators.maxLength(1000)]),
    fecha: new FormControl<string>(today(), [Validators.required])
  });

  protected observacionForm = new FormGroup({
    descripcion: new FormControl<string>('', [Validators.required, Validators.maxLength(1000)]),
    fecha: new FormControl<string>(today(), [Validators.required])
  });

  // ---------- Evidencias con archivo (imágenes, PDF, Word, Excel, PowerPoint, DWG, texto) ----------
  protected readonly iconos = ICONO_EVIDENCIA;
  protected readonly aceptar = EXTENSIONES_EVIDENCIA.map(e => '.' + e).join(',');
  protected readonly extensionesTexto = EXTENSIONES_EVIDENCIA.join(', ');
  protected $modo = signal<'archivo' | 'enlace'>('archivo');
  protected $archivo = signal<File | null>(null);
  protected $vistaPrevia = signal<string | null>(null);
  protected $subiendo = signal(false);
  // URL temporales (blob:) de las miniaturas de las imágenes subidas, por idEvidencia
  protected $miniaturas = signal<Record<number, string>>({});
  private readonly urlsTemporales: string[] = [];

  constructor() {
    // Libera la memoria de las URL temporales al salir de la pantalla
    this.destroyRef.onDestroy(() => this.urlsTemporales.forEach(u => URL.revokeObjectURL(u)));
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
      .subscribe(data => {
        this.$evidencias.set(data);
        this.cargarMiniaturas(data);
      });
  }

  private loadObservaciones() {
    this.observacionService.findAll()
      .pipe(map(list => list.filter(o => o.idSupervision === this.$id())))
      .subscribe(data => this.$observaciones.set(data));
  }

  // Las imágenes subidas se piden con el token y se muestran desde una URL temporal
  private cargarMiniaturas(evidencias: Evidencia[]) {
    for (const e of evidencias) {
      if (e.tieneArchivo && e.categoria === 'IMAGEN' && !this.$miniaturas()[e.idEvidencia]) {
        this.evidenciaService.descargarArchivo(e.idEvidencia).subscribe({
          next: blob => this.$miniaturas.update(m => ({ ...m, [e.idEvidencia]: this.urlTemporal(blob) })),
          error: () => { /* sin miniatura: se muestra el ícono */ }
        });
      }
    }
  }

  private urlTemporal(blob: Blob): string {
    const url = URL.createObjectURL(blob);
    this.urlsTemporales.push(url);
    return url;
  }

  cambiarModo(modo: 'archivo' | 'enlace') {
    this.$modo.set(modo);
    this.quitarArchivo();
    this.evidenciaForm.controls.imagen.reset('');
  }

  seleccionarArchivo(event: Event) {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0] ?? null;
    input.value = ''; // permite volver a elegir el mismo archivo
    if (!archivo) return;
    const extension = archivo.name.split('.').pop()?.toLowerCase() ?? '';
    if (!EXTENSIONES_EVIDENCIA.includes(extension)) {
      this.notify(`Tipo de archivo no permitido. Se aceptan: ${this.extensionesTexto}`, true);
      return;
    }
    if (archivo.size > TAMANO_MAXIMO_EVIDENCIA) {
      this.notify('El archivo supera el tamaño máximo de 10 MB', true);
      return;
    }
    this.quitarArchivo();
    this.$archivo.set(archivo);
    if (archivo.type.startsWith('image/')) {
      this.$vistaPrevia.set(this.urlTemporal(archivo));
    }
  }

  quitarArchivo() {
    this.$archivo.set(null);
    this.$vistaPrevia.set(null);
  }

  addEvidencia() {
    const { imagen, descripcion, fecha } = this.evidenciaForm.getRawValue();
    const archivo = this.$archivo();
    if (this.evidenciaForm.invalid || !fecha) {
      this.evidenciaForm.markAllAsTouched();
      return;
    }
    if (this.$modo() === 'archivo' && !archivo) {
      this.notify('Seleccione un archivo para la evidencia', true);
      return;
    }
    if (this.$modo() === 'enlace' && !imagen?.trim()) {
      this.evidenciaForm.controls.imagen.setErrors({ required: true });
      this.evidenciaForm.markAllAsTouched();
      return;
    }
    const peticion = this.$modo() === 'archivo' && archivo
      ? this.evidenciaService.subirArchivo(archivo, { descripcion, fecha, idSupervision: this.$id() })
      : this.evidenciaService.save({ imagen, descripcion, fecha, idSupervision: this.$id() });

    this.$subiendo.set(true);
    peticion.pipe(finalize(() => this.$subiendo.set(false))).subscribe({
      next: () => {
        this.evidenciaForm.reset({ imagen: '', descripcion: '', fecha: today() });
        this.quitarArchivo();
        this.loadEvidencias();
        this.notify('Evidencia registrada');
      },
      error: err => this.notify(getErrorMessage(err), true)
    });
  }

  // Abre imágenes y PDF en otra pestaña; Word, Excel y demás se descargan con su nombre original
  abrirEvidencia(e: Evidencia) {
    if (!e.tieneArchivo) {
      window.open(e.imagen, '_blank', 'noopener');
      return;
    }
    this.evidenciaService.descargarArchivo(e.idEvidencia).subscribe({
      next: blob => {
        const url = this.urlTemporal(blob);
        if (e.categoria === 'IMAGEN' || e.categoria === 'PDF') {
          window.open(url, '_blank');
        } else {
          const enlace = document.createElement('a');
          enlace.href = url;
          enlace.download = e.imagen;
          enlace.click();
        }
      },
      error: err => this.notify(getErrorMessage(err), true)
    });
  }

  tamano(bytes: number | null): string {
    if (bytes == null) return '';
    return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
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
    openConfirm(this.dialog, { title: 'Eliminar evidencia', message: `¿Eliminar la evidencia "${e.imagen}"? Esta acción no se puede deshacer.` })
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
