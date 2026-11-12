import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// Validadores personalizados reutilizables (lado del frontend).
// Reproducen las reglas del backend (DTO) para avisar al usuario ANTES de enviar la petición;
// el backend vuelve a validar porque el frontend se puede saltar.

const isEmpty = (value: unknown) => value === null || value === undefined || value === '';

export class AppValidators {

    // Rechaza textos formados solo por espacios ("   " pasa Validators.required)
    static notBlank: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
        const value = control.value;
        return typeof value === 'string' && value.length > 0 && value.trim().length === 0
            ? { blank: true }
            : null;
    };

    // RUC peruano: 11 dígitos que empiezan con 10, 15, 17 o 20
    static ruc: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
        if (isEmpty(control.value)) return null;
        return /^(10|15|17|20)\d{9}$/.test(control.value) ? null : { ruc: true };
    };

    // Celular peruano: 9 dígitos que empieza con 9 (opcional)
    static celular: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
        if (isEmpty(control.value)) return null;
        return /^9\d{8}$/.test(control.value) ? null : { celular: true };
    };

    // Contraseña segura: al menos una mayúscula, una minúscula y un número
    static passwordSegura: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
        if (isEmpty(control.value)) return null;
        const v: string = control.value;
        return /[A-Z]/.test(v) && /[a-z]/.test(v) && /\d/.test(v) ? null : { passwordSegura: true };
    };

    // La fecha no puede ser posterior a hoy
    static noFutura: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
        if (isEmpty(control.value)) return null;
        const fecha = new Date(control.value);
        const hoy = new Date();
        hoy.setHours(23, 59, 59, 999);
        return fecha > hoy ? { futura: true } : null;
    };

    // Validador de grupo: el campo "hasta" debe ser posterior al campo "desde"
    static rangoFechas(desde: string, hasta: string): ValidatorFn {
        return (group: AbstractControl): ValidationErrors | null => {
            const inicio = group.get(desde)?.value;
            const fin = group.get(hasta)?.value;
            if (isEmpty(inicio) || isEmpty(fin)) return null;
            return new Date(fin) > new Date(inicio) ? null : { rangoFechas: true };
        };
    }
}

// Pinta en cada campo del formulario los errores de validación que devolvió el backend
// (cuerpo { errores: { campo: mensaje } } del GlobalExceptionHandler). Devuelve true si aplicó alguno.
export function applyServerErrors(form: AbstractControl, err: unknown): boolean {
    const errores = (err as { error?: { errores?: Record<string, string> } })?.error?.errores;
    if (!errores) return false;
    let applied = false;
    Object.entries(errores).forEach(([campo, mensaje]) => {
        const control = form.get(campo);
        if (control) {
            control.setErrors({ server: mensaje });
            control.markAsTouched();
            applied = true;
        }
    });
    return applied;
}

// Mensaje legible para el primer error del control (para usar en <mat-error>)
export function errorMessage(control: AbstractControl | null, label = 'Este campo'): string {
    if (!control?.errors) return '';
    const e = control.errors;
    if (e['server']) return e['server'];
    if (e['required']) return `${label} es obligatorio`;
    if (e['blank']) return `${label} no puede contener solo espacios`;
    if (e['minlength']) return `${label} debe tener al menos ${e['minlength'].requiredLength} caracteres`;
    if (e['maxlength']) return `${label} no puede superar ${e['maxlength'].requiredLength} caracteres`;
    if (e['email']) return 'El correo no tiene un formato válido';
    if (e['ruc']) return 'El RUC debe tener 11 dígitos y empezar con 10, 15, 17 o 20';
    if (e['celular']) return 'El teléfono debe tener 9 dígitos y empezar con 9';
    if (e['passwordSegura']) return 'Debe incluir mayúsculas, minúsculas y números';
    if (e['futura']) return 'La fecha no puede ser futura';
    if (e['min']) return `${label} debe ser mayor o igual a ${e['min'].min}`;
    if (e['max']) return `${label} debe ser menor o igual a ${e['max'].max}`;
    if (e['pattern']) return `${label} no tiene un formato válido`;
    return `${label} no es válido`;
}
