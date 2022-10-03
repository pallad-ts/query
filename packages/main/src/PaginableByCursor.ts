export interface PaginableByCursor {
    after?: string;
    before?: string;
    /**
     * Limit of entities to return
     *
     * This value is always provided due to default limit set in QueryBuilder
     */
    limit: number;
}

export namespace PaginableByCursor {
    export interface ResultMeta {
        nextPage?: string;
        previousPage?: string;
        limit: number;
    }
}
