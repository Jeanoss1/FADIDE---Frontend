import { Pipe, PipeTransform } from '@angular/core';
import { FormatoValor } from '../model/dashboard';

const SOLES = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 });
const SOLES_CORTO = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', notation: 'compact', maximumFractionDigits: 1 });
const NUMERO = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 2 });

// Da formato a un indicador según el tipo que envía el backend: S/ 1 250 000, 45,5 %, 2,5 UIT
@Pipe({ name: 'valor' })
export class ValorPipe implements PipeTransform {
  transform(valor: number | null | undefined, formato: FormatoValor, corto = false): string {
    const v = Number(valor ?? 0);
    switch (formato) {
      case 'MONEDA':
        return (corto ? SOLES_CORTO : SOLES).format(v);
      case 'PORCENTAJE':
        return `${NUMERO.format(v)} %`;
      case 'UIT':
        return `${NUMERO.format(v)} UIT`;
      default:
        return NUMERO.format(v);
    }
  }
}
