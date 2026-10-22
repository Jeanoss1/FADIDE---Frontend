// Fechas del backend (LocalDate) llegan como 'yyyy-MM-dd'

export function today(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Días que faltan para la fecha (negativo si ya pasó)
export function diasHasta(fecha: string): number {
    const [y, m, d] = fecha.split('-').map(Number);
    const target = new Date(y, m - 1, d).getTime();
    const [ty, tm, td] = today().split('-').map(Number);
    const now = new Date(ty, tm - 1, td).getTime();
    return Math.round((target - now) / 86_400_000);
}

export type Vencimiento = { label: string; css: string };

// Semáforo de vencimiento: vencido, por vencer (<= 30 días) o vigente
export function estadoVencimiento(fecha: string, umbral = 30): Vencimiento {
    const dias = diasHasta(fecha);
    if (dias < 0) return { label: 'Vencido', css: 'badge badge-danger' };
    if (dias <= umbral) return { label: `Vence en ${dias} d`, css: 'badge badge-warning' };
    return { label: 'Vigente', css: 'badge badge-success' };
}
