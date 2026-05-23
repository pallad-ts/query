export interface PaginationByOffset {
    offset?: number;
    /**
     * Limit of entities to return
     *
     * This value is always provided due to default limit set in QueryBuilder
     */
    limit: number;
}

export namespace PaginationByOffset {
    export type Input = Partial<PaginationByOffset>;
    export interface PageInfo {
        offset: number;
        limit: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    }

    export interface Result<T> {
        list: T[];
        pageInfo: PageInfo;
    }
}
