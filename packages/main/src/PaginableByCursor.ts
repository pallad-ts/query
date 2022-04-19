export interface PaginableByCursor {
    after?: string;
    before?: string;
    limit: number;
}

export namespace PaginableByCursor {
    export interface ResultMeta {
        nextPage?: string;
        previousPage?: string;
        limit: number;
    }
}
