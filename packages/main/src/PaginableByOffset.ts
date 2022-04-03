export interface PaginableByOffset {
    offset?: number;
    limit: number;
}

export namespace PaginationByOffset {
    export interface ResultMeta {
        offset: number;
        limit: number;
    }
}
