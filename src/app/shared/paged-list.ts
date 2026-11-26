import { DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Sort } from '@angular/material/sort';
import { EMPTY, Subject, catchError, combineLatest, debounceTime, distinctUntilChanged, finalize, switchMap } from 'rxjs';
import { getErrorMessage } from '../core/utils/http-error';
import { PageQuery } from '../model/page';
import { GenericService } from '../services/generic.service';

export interface PagedListOptions {
    // Columna de la tabla -> campo de la entidad en el backend (cuando no coinciden)
    sortMap?: Record<string, string>;
    // Orden inicial, por ejemplo 'fechaPago,desc'
    sort?: string;
    size?: number;
}

/**
 * Listado paginado en el servidor reutilizable por todas las tablas.
 * Mantiene la consulta (página, tamaño, orden, búsqueda y filtros) en un signal; cada vez que
 * cambia, o que el servicio pide recargar, solicita al backend solo la página visible.
 * La búsqueda por texto espera 350 ms sin escribir antes de consultar (debounce), para no
 * enviar una petición por cada tecla. Debe crearse en el inicializador de un componente.
 */
export class PagedList<T> {
    private readonly snackBar = inject(MatSnackBar);
    private readonly search$ = new Subject<string>();

    readonly $query = signal<PageQuery>({});
    readonly $loading = signal(false);
    readonly $rows;
    readonly $total;

    constructor(private readonly service: GenericService<T>, private readonly options: PagedListOptions = {}) {
        this.$rows = service.$dataChange;
        this.$total = service.$totalChange;
        this.$query.set({ page: 0, size: options.size ?? 10, sort: options.sort });

        const destroyRef = inject(DestroyRef);

        this.search$.pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed(destroyRef))
            .subscribe(q => this.filter({ q }));

        combineLatest([toObservable(this.$query), toObservable(service.$reloadRequest)]).pipe(
            switchMap(([query]) => {
                this.$loading.set(true);
                return service.findPage(query).pipe(
                    catchError(err => {
                        this.snackBar.open(getErrorMessage(err), 'OK', { duration: 4000, panelClass: 'snack-error' });
                        return EMPTY;
                    }),
                    finalize(() => this.$loading.set(false))
                );
            }),
            takeUntilDestroyed(destroyRef)
        ).subscribe(page => service.setPage(page));
    }

    get page(): number {
        return Number(this.$query()['page'] ?? 0);
    }

    get size(): number {
        return Number(this.$query()['size'] ?? 10);
    }

    search(text: string) {
        this.search$.next(text.trim());
    }

    // Aplica uno o más filtros y vuelve a la primera página
    filter(patch: PageQuery) {
        this.$query.update(q => ({ ...q, ...patch, page: 0 }));
    }

    clear(keys: string[]) {
        this.$query.update(q => {
            const next = { ...q, page: 0 };
            keys.forEach(k => delete next[k]);
            return next;
        });
    }

    onPage(e: PageEvent) {
        this.$query.update(q => ({ ...q, page: e.pageIndex, size: e.pageSize }));
    }

    onSort(s: Sort) {
        const field = this.options.sortMap?.[s.active] ?? s.active;
        this.$query.update(q => ({ ...q, page: 0, sort: s.direction ? `${field},${s.direction}` : this.options.sort }));
    }
}
