import { Cursor } from "@pallad/cursor-encoder";
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

    export interface PageInfo<TCursorKey = unknown> {
        limit: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
        startCursor?: Cursor<TCursorKey>;
        endCursor?: Cursor<TCursorKey>;
    }

    export interface Result<T, TCursorKey = unknown> {
        edges: Array<Node<T, TCursorKey>>;
        nodes: T[];
        pageInfo: PageInfo<TCursorKey>;
    }

    export interface Node<T, TCursorKey = unknown> {
        node: T;
        cursor: Cursor<TCursorKey>;
    }
}
