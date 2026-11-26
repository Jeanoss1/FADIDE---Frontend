import { Component, computed, effect, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { catchError, finalize, of } from 'rxjs';
import { getErrorMessage } from '../../core/utils/http-error';
import { PageQuery } from '../../model/page';
import { DefinicionReporte, REPORTES, TablaReporte } from '../../model/reporte';
import { ProyectoService } from '../../services/proyecto.service';
import { ReporteService } from '../../services/reporte.service';

/**
 * Reportes con filtros (fecha, estado, obra y supervisor) y exportación a PDF y Excel.
 * La vista previa y los archivos los genera el backend con los mismos filtros, por lo que
 * lo que se ve en pantalla coincide con lo que se descarga.
 */
@Component({
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatSelectModule,
    MatTableModule
  ],
  selector: 'app-reporte',
  templateUrl: './reporte.component.html',
})
export class ReporteComponent {
  private readonly reporteService = inject(ReporteService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly reportes = REPORTES;
  protected readonly $obras = toSignal(inject(ProyectoService).findAll().pipe(catchError(() => of([]))), { initialValue: [] });
  protected readonly $supervisores = toSignal(this.reporteService.supervisores().pipe(catchError(() => of([]))), { initialValue: [] });

  protected $definicion = signal<DefinicionReporte>(REPORTES[0]);
  protected $filtros = signal<PageQuery>({});
  protected $reporte = signal<TablaReporte | null>(null);
  protected $cargando = signal(false);
  protected $descargando = signal<'pdf' | 'excel' | null>(null);

  protected $dataSource = new MatTableDataSource<string[]>([]);
  protected $paginator = viewChild(MatPaginator);
  protected $columnas = computed(() => (this.$reporte()?.columnas ?? []).map((_, i) => 'c' + i));

  constructor() {
    effect(() => {
      this.$dataSource.paginator = this.$paginator() ?? null;
    });
    this.generar();
  }

  protected seleccionar(def: DefinicionReporte) {
    this.$definicion.set(def);
    this.$filtros.set({});
    this.generar();
  }

  protected filtro(key: string, value: string | number | null) {
    this.$filtros.update(f => ({ ...f, [key]: value || null }));
  }

  protected limpiar() {
    this.$filtros.set({});
    this.generar();
  }

  protected generar() {
    const f = this.$filtros();
    if (f['desde'] && f['hasta'] && String(f['hasta']) < String(f['desde'])) {
      this.snackBar.open('La fecha "hasta" no puede ser anterior a la fecha "desde"', 'OK', { duration: 4000, panelClass: 'snack-error' });
      return;
    }
    this.$cargando.set(true);
    this.reporteService.vistaPrevia(this.$definicion().tipo, f).pipe(
      finalize(() => this.$cargando.set(false))
    ).subscribe({
      next: reporte => {
        this.$reporte.set(reporte);
        this.$dataSource.data = reporte.filas;
        this.$paginator()?.firstPage();
      },
      error: err => this.snackBar.open(getErrorMessage(err), 'OK', { duration: 4000, panelClass: 'snack-error' })
    });
  }

  protected exportar(formato: 'pdf' | 'excel') {
    const tipo = this.$definicion().tipo;
    this.$descargando.set(formato);
    this.reporteService.exportar(tipo, formato, this.$filtros()).pipe(
      finalize(() => this.$descargando.set(null))
    ).subscribe({
      next: blob => {
        // Descarga el archivo recibido sin abrir otra pestaña
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-${tipo}-${new Date().toISOString().slice(0, 10)}.${formato === 'pdf' ? 'pdf' : 'xlsx'}`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: err => this.snackBar.open(getErrorMessage(err), 'OK', { duration: 4000, panelClass: 'snack-error' })
    });
  }

  protected esNumerica(indice: number): boolean {
    return this.$reporte()?.numericas.includes(indice) ?? false;
  }

  protected valor(key: string) {
    return this.$filtros()[key] ?? null;
  }
}

