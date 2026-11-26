import { Licencia } from './licencia';

export type FormatoValor = 'NUMERO' | 'MONEDA' | 'PORCENTAJE' | 'UIT';

export interface Kpi {
    clave: string;
    etiqueta: string;
    valor: number;
    formato: FormatoValor;
    icono: string;
    ruta: string | null;
}

export interface Punto {
    etiqueta: string;
    valor: number;
}

// COLUMNAS: serie en el tiempo · BARRAS: partes de un total · MEDIDORES: porcentaje frente a 100 %
export interface Grafico {
    clave: string;
    titulo: string;
    tipo: 'COLUMNAS' | 'BARRAS' | 'MEDIDORES';
    formato: FormatoValor;
    datos: Punto[];
}

// Respuesta de GET /api/dashboard: el backend decide los indicadores según el rol
export interface Dashboard {
    rol: string;
    kpis: Kpi[];
    graficos: Grafico[];
    licenciasPorVencer: Licencia[];
}
