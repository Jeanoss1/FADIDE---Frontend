// Respuesta de los endpoints GET /api/{recurso}/page (PageResponse del backend)
export interface Page<T> {
    content: T[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
}

// Parámetros de un listado paginado: página, tamaño, orden y filtros (FiltroBusqueda del backend)
export type PageQuery = Record<string, string | number | null | undefined>;
