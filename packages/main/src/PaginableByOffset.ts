export interface PaginableByOffset {
    offset?: number;
    limit?: number;
}

export namespace PaginableByOffset {
    export interface ResultMeta {
        offset: number;
        limit: number;
    }
}
