import { inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Page, PageQuery } from '../model/page';

// Igual que el GenericService del backend: CRUD común + estado compartido con signals
export abstract class GenericService<T> {
    protected readonly http = inject(HttpClient);
    private readonly _data = signal<T[]>([]);
    private readonly _message = signal<string>('');
    private readonly _total = signal<number>(0);
    private readonly _reload = signal<number>(0);

    readonly $dataChange = this._data.asReadonly();
    readonly $messageChange = this._message.asReadonly();
    // Total de registros en el servidor (para el paginador) y señal para pedir recargar la página
    readonly $totalChange = this._total.asReadonly();
    readonly $reloadRequest = this._reload.asReadonly();

    constructor(protected url: string) {}

    findAll() {
        return this.http.get<T[]>(this.url);
    }

    // Paginación, búsqueda y filtros en el servidor: GET /api/{recurso}/page?page=0&size=10&q=...
    findPage(query: PageQuery) {
        let params = new HttpParams();
        for (const [key, value] of Object.entries(query)) {
            if (value !== null && value !== undefined && value !== '') {
                params = params.set(key, String(value));
            }
        }
        return this.http.get<Page<T>>(`${this.url}/page`, { params });
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

    // Guarda la página recibida del backend: filas visibles y total de registros
    setPage(page: Page<T>) {
        this._data.set(page.content);
        this._total.set(page.totalElements);
    }

    // Escenario con recarga: tras guardar o eliminar, el listado vuelve a pedir la página actual
    requestReload() {
        this._reload.update(n => n + 1);
    }

    // ---------- Mutación silenciosa ----------
    // En lugar de volver a pedir la página tras guardar o eliminar, se modifica el signal con
    // la respuesta del backend. La tabla se actualiza sola, sin recargar la página, sin una
    // segunda petición HTTP y sin perder el filtro, el orden ni la página actual.

    // POST correcto: agrega el registro devuelto por el backend al inicio de la lista
    addLocal(item: T) {
        this._data.update(list => [item, ...list]);
        this._total.update(n => n + 1);
    }

    // PUT correcto: reemplaza solo el registro editado
    replaceLocal(item: T, isSame: (current: T) => boolean) {
        this._data.update(list => list.map(current => isSame(current) ? item : current));
    }

    // DELETE correcto (204): quita el registro de la lista
    removeLocal(isSame: (current: T) => boolean) {
        this._data.update(list => list.filter(current => !isSame(current)));
        this._total.update(n => Math.max(n - 1, 0));
    }
}
