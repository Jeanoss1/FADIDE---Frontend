import { OpcionFiltro } from '../shared/filtros-listado/filtros-listado.component';
import { ESTADOS_CONTRATO } from './contrato';
import { ESTADOS_PAGO } from './pago';
import { ESTADOS_PENALIDAD } from './penalidad';
import { ESTADOS_PROYECTO } from './proyecto';
import { RolNombre } from './rol';

// TablaReporte del backend: valores ya formateados, iguales a los del PDF y el Excel
export interface TablaReporte {
    titulo: string;
    filtros: string;
    columnas: string[];
    numericas: number[];
    filas: string[][];
    totales: string[] | null;
}

export interface OpcionId {
    id: number;
    nombre: string;
}

export type TipoReporte = 'contratos' | 'pagos' | 'penalidades' | 'supervisiones' | 'licencias' | 'obras';

// Qué filtros admite cada reporte (deben coincidir con las Especificaciones del backend)
export interface DefinicionReporte {
    tipo: TipoReporte;
    nombre: string;
    descripcion: string;
    icono: string;
    fechas?: string;
    estados?: OpcionFiltro[];
    porObra?: boolean;
    porSupervisor?: boolean;
    roles: RolNombre[];   // roles que pueden generarlo (igual que en ReporteController)
}

const opciones = (estados: string[]): OpcionFiltro[] => estados.map(e => {
    const t = e.replace(/_/g, ' ').toLowerCase();
    return { value: e, label: t.charAt(0).toUpperCase() + t.slice(1) };
});

const GESTION: RolNombre[] = ['ADMIN', 'GESTOR'];
const CAMPO: RolNombre[] = ['ADMIN', 'SUPERVISOR'];

export const REPORTES: DefinicionReporte[] = [
    { tipo: 'contratos', nombre: 'Contratos y saldos', descripcion: 'Monto, pagado y saldo pendiente de cada contrato', icono: 'assignment', fechas: 'Inicio', estados: opciones(ESTADOS_CONTRATO), porObra: true, roles: GESTION },
    { tipo: 'pagos', nombre: 'Pagos', descripcion: 'Pagos registrados con su conformidad', icono: 'payments', fechas: 'Fecha de pago', estados: opciones(ESTADOS_PAGO), porObra: true, roles: GESTION },
    { tipo: 'penalidades', nombre: 'Penalidades', descripcion: 'Penalidades aplicadas en UIT', icono: 'gavel', fechas: 'Aplicación', estados: opciones(ESTADOS_PENALIDAD), roles: GESTION },
    { tipo: 'supervisiones', nombre: 'Supervisiones', descripcion: 'Avance físico registrado por cada supervisor', icono: 'fact_check', fechas: 'Registro', porObra: true, porSupervisor: true, roles: CAMPO },
    { tipo: 'licencias', nombre: 'Licencias', descripcion: 'Vigencia y días restantes de cada licencia', icono: 'description', fechas: 'Vencimiento', porObra: true, roles: GESTION },
    { tipo: 'obras', nombre: 'Obras', descripcion: 'Obras por estado y cliente', icono: 'apartment', estados: ESTADOS_PROYECTO.map(e => ({ value: e.value, label: e.label })), roles: ['ADMIN', 'GESTOR', 'SUPERVISOR'] },
];
