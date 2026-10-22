import { HttpErrorResponse } from '@angular/common/http';

// Convierte la respuesta de error del backend (GlobalExceptionHandler) en un texto legible
export function getErrorMessage(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
        if (err.status === 0) {
            return 'No se pudo conectar con el servidor. Verifica que el backend esté en ejecución.';
        }
        if (err.status === 403) {
            return 'No tienes permisos para realizar esta acción.';
        }
        const body = err.error;
        if (body?.errores) {
            return Object.values(body.errores).join(' · ');
        }
        if (body?.message) {
            return body.message;
        }
    }
    return 'Ocurrió un error inesperado.';
}
