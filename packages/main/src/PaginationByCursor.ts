export interface PaginationByCursor {
    after?: string;
    before?: string;
    /**
     * Limit of entities to return
     *
     * This value is always provided due to default limit set in QueryBuilder
     */
    limit: number;
}

export namespace PaginationByCursor {
    export type Input = Partial<PaginationByCursor>;

    export interface PageInfo {
        limit: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
        startCursor?: string;
        endCursor?: string;
    }

    export interface Result<T> {
        edges: Array<Node<T>>;
        nodes: T[];
        pageInfo: PageInfo;
    }

    export interface Node<T> {
        node: T;
        cursor: string;
    }
}
