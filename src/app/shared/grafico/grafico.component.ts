import { Component, computed, input } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Grafico, Punto } from '../../model/dashboard';
import { ValorPipe } from '../valor.pipe';

/**
 * Gráfico del dashboard dibujado con HTML y CSS (sin librerías externas):
 * - COLUMNAS: una serie en el tiempo (pagos o supervisiones por mes).
 * - BARRAS: partes de un total ordenadas de mayor a menor (obras o contratos por estado).
 * - MEDIDORES: porcentaje de cada fila frente a 100 % (avance físico por contrato).
 * Una sola serie en el color de marca; cada marca muestra su valor al pasar el mouse o al
 * enfocarla con el teclado, y debajo se ofrece la misma información como tabla accesible.
 */
@Component({
  selector: 'app-grafico',
  imports: [MatTooltipModule, ValorPipe],
  templateUrl: './grafico.component.html',
  styleUrl: './grafico.component.css'
})
export class GraficoComponent {
  readonly grafico = input.required<Grafico>();

  protected $datos = computed<Punto[]>(() => {
    const g = this.grafico();
    const datos = g.datos.map(d => ({ ...d, valor: Number(d.valor) }));
    // Las partes de un total se comparan mejor ordenadas de mayor a menor
    return g.tipo === 'BARRAS' ? [...datos].sort((a, b) => b.valor - a.valor) : datos;
  });

  protected $vacio = computed(() => this.$datos().every(d => d.valor === 0));

  // Máximo "redondo" del eje para que las líneas guía caigan en valores legibles
  protected $maximo = computed(() => {
    if (this.grafico().tipo === 'MEDIDORES') return 100;
    const max = Math.max(...this.$datos().map(d => d.valor), 0);
    if (max <= 0) return 1;
    const potencia = Math.pow(10, Math.floor(Math.log10(max)));
    const paso = [1, 2, 2.5, 5, 10].find(p => p * potencia >= max) ?? 10;
    return paso * potencia;
  });

  protected porcentaje(valor: number): number {
    return Math.min(100, Math.max(0, (valor / this.$maximo()) * 100));
  }

  protected $resumen = computed(() => {
    const g = this.grafico();
    return `${g.titulo}: ${this.$datos().length} valores. La tabla de datos está disponible debajo del gráfico.`;
  });
}
