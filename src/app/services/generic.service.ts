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
}
