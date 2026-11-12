import { inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// Igual que el GenericService del backend: CRUD común + estado compartido con signals
export abstract class GenericService<T> {
    protected readonly http = inject(HttpClient);
    private readonly _data = signal<T[]>([]);
    private readonly _message = signal<string>('');

    readonly $dataChange = this._data.asReadonly();
    readonly $messageChange = this._message.asReadonly();

    constructor(protected url: string) {}

    findAll() {
        return this.http.get<T[]>(this.url);
    }

    findById(id: number) {
        return this.http.get<T>(`${this.url}/${id}`);
    }

    save(entity: unknown) {
        return this.http.post<T>(this.url, entity);
    }

    update(id: number, entity: unknown) {
        return this.http.put<T>(`${this.url}/${id}`, entity);
    }

    delete(id: number) {
        return this.http.delete(`${this.url}/${id}`);
    }

    setDataChange(data: T[]) {
        this._data.set(data);
    }

    setMessageChange(msg: string) {
        this._message.set(msg);
    }

    // ---------- Mutación silenciosa ----------
    // En lugar de volver a pedir toda la lista (findAll) tras guardar o eliminar, se modifica
    // el signal con la respuesta del backend. La tabla se actualiza sola, sin recargar la
    // página, sin una segunda petición HTTP y sin perder el filtro, el orden ni la página actual.

    // POST correcto: agrega el registro devuelto por el backend al inicio de la lista
    addLocal(item: T) {
        this._data.update(list => [item, ...list]);
    }

    // PUT correcto: reemplaza solo el registro editado
    replaceLocal(item: T, isSame: (current: T) => boolean) {
        this._data.update(list => list.map(current => isSame(current) ? item : current));
    }

    // DELETE correcto (204): quita el registro de la lista
    removeLocal(isSame: (current: T) => boolean) {
        this._data.update(list => list.filter(current => !isSame(current)));
    }
}
