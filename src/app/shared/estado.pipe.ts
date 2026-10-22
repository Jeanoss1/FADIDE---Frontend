import { Pipe, PipeTransform } from '@angular/core';

// Color del badge según el estado (proyectos, contratos, pagos, penalidades)
const CLASES: Record<string, string> = {
  PLANIFICADO: 'badge-info',
  EN_EJECUCION: 'badge-orange',
  PAUSADO: 'badge-warning',
  FINALIZADO: 'badge-success',
  CANCELADO: 'badge-danger',
  VIGENTE: 'badge-info',
  SUSPENDIDO: 'badge-warning',
  CONFORME: 'badge-success',
  RESUELTO: 'badge-danger',
  REGISTRADO: 'badge-info',
  PENDIENTE: 'badge-warning',
  PAGADO: 'badge-success',
  ANULADO: 'badge-danger',
  APLICADA: 'badge-danger',
  CONDONADA: 'badge-info',
  PAGADA: 'badge-success',
};

@Pipe({ name: 'estadoClass' })
export class EstadoClassPipe implements PipeTransform {
  transform(estado: string | null | undefined): string {
    return 'badge ' + (CLASES[estado ?? ''] ?? '');
  }
}

// EN_EJECUCION -> En ejecucion
@Pipe({ name: 'estadoLabel' })
export class EstadoLabelPipe implements PipeTransform {
  transform(estado: string | null | undefined): string {
    if (!estado) return '—';
    const text = estado.replace(/_/g, ' ').toLowerCase();
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
}
