import { Component, computed, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PagedList } from '../paged-list';

export interface OpcionFiltro {
  value: string | number;
  label: string;
}

// Lista desplegable de filtro: key es el parámetro que recibe el backend (estado, idRol...)
export interface SelectFiltro {
  key: string;
  label: string;
  options: OpcionFiltro[];
}

// Convierte ['VIGENTE', 'EN_EJECUCION'] en opciones con etiqueta legible ("En ejecucion")
export function opcionesDeEstados(estados: string[]): OpcionFiltro[] {
  return estados.map(e => {
    const text = e.replace(/_/g, ' ').toLowerCase();
    return { value: e, label: text.charAt(0).toUpperCase() + text.slice(1) };
  });
}

/**
 * Barra de filtros de un listado paginado: listas desplegables y rango de fechas.
 * Cada cambio se envía al PagedList, que vuelve a pedir la primera página al backend.
 */
@Component({
  selector: 'app-filtros-listado',
  imports: [MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule, MatTooltipModule],
  template: `
    @for (s of selects(); track s.key) {
      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="filtro">
        <mat-label>{{ s.label }}</mat-label>
        <mat-select [value]="valor(s.key)" (selectionChange)="aplicar(s.key, $event.value)">
          <mat-option [value]="null">Todos</mat-option>
          @for (o of s.options; track o.value) {
            <mat-option [value]="o.value">{{ o.label }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
    }
    @if (fechas()) {
      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="filtro">
        <mat-label>{{ fechas() }} desde</mat-label>
        <input matInput type="date" [value]="valor('desde') ?? ''" [max]="valor('hasta') ?? ''"
               (change)="aplicar('desde', $any($event.target).value)" />
      </mat-form-field>
      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="filtro">
        <mat-label>{{ fechas() }} hasta</mat-label>
        <input matInput type="date" [value]="valor('hasta') ?? ''" [min]="valor('desde') ?? ''"
               (change)="aplicar('hasta', $any($event.target).value)" />
      </mat-form-field>
    }
    @if ($activos()) {
      <button mat-stroked-button type="button" (click)="limpiar()" matTooltip="Quitar los filtros">
        <mat-icon>filter_alt_off</mat-icon> Limpiar
      </button>
    }
  `,
  host: { class: 'filtros-listado' }
})
export class FiltrosListadoComponent {
  readonly list = input.required<PagedList<any>>();
  readonly selects = input<SelectFiltro[]>([]);
  // Texto del campo de fecha (por ejemplo "Fecha de pago"); vacío = sin filtro de fechas
  readonly fechas = input<string>('');

  protected $activos = computed(() => {
    const q = this.list().$query();
    return ['desde', 'hasta', ...this.selects().map(s => s.key)].some(k => q[k] !== null && q[k] !== undefined && q[k] !== '');
  });

  protected valor(key: string) {
    return this.list().$query()[key] ?? null;
  }

  protected aplicar(key: string, value: string | number | null) {
    this.list().filter({ [key]: value || null });
  }

  protected limpiar() {
    this.list().clear(['desde', 'hasta', ...this.selects().map(s => s.key)]);
  }
}
