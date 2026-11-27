import { Component, DestroyRef, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter, finalize, switchMap } from 'rxjs';
import { today } from '../../../core/utils/dates';
import { getErrorMessage } from '../../../core/utils/http-error';
import { EXTENSIONES_EVIDENCIA, ICONO_EVIDENCIA, TAMANO_MAXIMO_EVIDENCIA } from '../../../model/evidencia';
import { EvidenciaPenalidad } from '../../../model/evidencia-penalidad';
import { Penalidad } from '../../../model/penalidad';
import { EvidenciaPenalidadService } from '../../../services/evidencia-penalidad.service';
import { openConfirm } from '../../../shared/confirm-dialog/confirm-dialog.component';

export interface PenalidadEvidenciasData {
  penalidad: Penalidad;
  numeroContrato: string;
  puedeEditar: boolean;
}

/** Documentos de sustento de una penalidad: actas, informes, cartas, fotos, hojas de cálculo, etc. */
@Component({
  imports: [
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatTooltipModule
  ],
  selector: 'app-penalidad-evidencias',
  styleUrl: './penalidad-evidencias.component.css',
  templateUrl: './penalidad-evidencias.component.html',
})
export class PenalidadEvidenciasComponent {
  private readonly evidenciaService = inject(EvidenciaPenalidadService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly data = inject<PenalidadEvidenciasData>(MAT_DIALOG_DATA);

  protected readonly iconos = ICONO_EVIDENCIA;
  protected readonly aceptar = EXTENSIONES_EVIDENCIA.map(e => '.' + e).join(',');
  protected readonly maxDate = today();

  protected $evidencias = signal<EvidenciaPenalidad[]>([]);
  protected $cargando = signal(true);
  protected $subiendo = signal(false);
  protected $archivo = signal<File | null>(null);
  protected $vistaPrevia = signal<string | null>(null);
  protected $miniaturas = signal<Record<number, string>>({});
  private readonly urlsTemporales: string[] = [];

  protected form = new FormGroup({
    descripcion: new FormControl<string>('', [Validators.maxLength(1000)]),
    fecha: new FormControl<string>(today(), [Validators.required])
  });

  constructor() {
    this.destroyRef.onDestroy(() => this.urlsTemporales.forEach(u => URL.revokeObjectURL(u)));
    this.cargar();
  }

  private cargar() {
    this.$cargando.set(true);
    this.evidenciaService.listar(this.data.penalidad.idPenalidad)
      .pipe(finalize(() => this.$cargando.set(false)))
      .subscribe({
        next: lista => {
          this.$evidencias.set(lista);
          for (const e of lista) {
            if (e.categoria === 'IMAGEN' && !this.$miniaturas()[e.idEvidenciaPenalidad]) {
              this.evidenciaService.descargar(e.idEvidenciaPenalidad).subscribe(blob =>
                this.$miniaturas.update(m => ({ ...m, [e.idEvidenciaPenalidad]: this.urlTemporal(blob) })));
            }
          }
        },
        error: err => this.notify(getErrorMessage(err), true)
      });
  }

  private urlTemporal(blob: Blob): string {
    const url = URL.createObjectURL(blob);
    this.urlsTemporales.push(url);
    return url;
  }

  seleccionar(event: Event) {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0] ?? null;
    input.value = '';
    if (!archivo) return;
    const extension = archivo.name.split('.').pop()?.toLowerCase() ?? '';
    if (!EXTENSIONES_EVIDENCIA.includes(extension)) {
      this.notify(`Tipo de archivo no permitido. Se aceptan: ${EXTENSIONES_EVIDENCIA.join(', ')}`, true);
      return;
    }
    if (archivo.size > TAMANO_MAXIMO_EVIDENCIA) {
      this.notify('El archivo supera el tamaño máximo de 10 MB', true);
      return;
    }
    this.$archivo.set(archivo);
    this.$vistaPrevia.set(archivo.type.startsWith('image/') ? this.urlTemporal(archivo) : null);
  }

  quitar() {
    this.$archivo.set(null);
    this.$vistaPrevia.set(null);
  }

  subir() {
    const archivo = this.$archivo();
    const { descripcion, fecha } = this.form.getRawValue();
    if (!archivo) {
      this.notify('Seleccione un archivo', true);
      return;
    }
    if (this.form.invalid || !fecha) {
      this.form.markAllAsTouched();
      return;
    }
    this.$subiendo.set(true);
    this.evidenciaService.subir(this.data.penalidad.idPenalidad, archivo, { descripcion, fecha })
      .pipe(finalize(() => this.$subiendo.set(false)))
      .subscribe({
        next: () => {
          this.quitar();
          this.form.reset({ descripcion: '', fecha: today() });
          this.cargar();
          this.notify('Evidencia registrada');
        },
        error: err => this.notify(getErrorMessage(err), true)
      });
  }

  // Imágenes y PDF se abren en otra pestaña; los demás se descargan con su nombre original
  abrir(e: EvidenciaPenalidad) {
    this.evidenciaService.descargar(e.idEvidenciaPenalidad).subscribe({
      next: blob => {
        const url = this.urlTemporal(blob);
        if (e.categoria === 'IMAGEN' || e.categoria === 'PDF') {
          window.open(url, '_blank');
        } else {
          const enlace = document.createElement('a');
          enlace.href = url;
          enlace.download = e.nombreOriginal;
          enlace.click();
        }
      },
      error: err => this.notify(getErrorMessage(err), true)
    });
  }

  eliminar(e: EvidenciaPenalidad) {
    openConfirm(this.dialog, { title: 'Eliminar evidencia', message: `¿Eliminar "${e.nombreOriginal}"? Esta acción no se puede deshacer.` })
      .pipe(filter(Boolean), switchMap(() => this.evidenciaService.eliminar(e.idEvidenciaPenalidad)))
      .subscribe({
        next: () => { this.cargar(); this.notify('Evidencia eliminada'); },
        error: err => this.notify(getErrorMessage(err), true)
      });
  }

  tamano(bytes: number | null): string {
    if (bytes == null) return '';
    return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  private notify(message: string, isError = false) {
    this.snackBar.open(message, 'OK', {
      duration: isError ? 4000 : 2500, horizontalPosition: 'right', verticalPosition: 'top',
      panelClass: isError ? 'snack-error' : 'snack-ok'
    });
  }
}
