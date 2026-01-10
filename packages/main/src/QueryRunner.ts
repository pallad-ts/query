import { PaginationByCursor } from "./PaginationByCursor";
import { PaginationByOffset } from "./PaginationByOffset";

export type QueryRunner<
    TQuery,
    TResult extends PaginationByCursor.Result<any> | PaginationByOffset.Result<any>,
> = (query: TQuery) => Promise<TResult> | TResult;
