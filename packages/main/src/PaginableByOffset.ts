export interface PaginableByOffset {
    offset?: number;
    /**
     * Limit of entities to return
     *
     * This value is always provided due to default limit set in QueryBuilder
     */
    limit: number;
}

export namespace PaginableByOffset {
    export interface ResultMeta {
        offset: number;
        limit: number;
    }
}
