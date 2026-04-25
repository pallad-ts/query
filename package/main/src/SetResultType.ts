import { NoPagination } from "./NoPagination";
import { PaginationByOffset } from "./PaginationByOffset";
import { PaginationByCursor } from "./PaginationByCursor";

export type SetResultType<
    TEntity,
    TResult extends
        | NoPagination.Result<any>
        | PaginationByOffset.Result<any>
        | PaginationByCursor.Result<any>,
> =
    TResult extends PaginationByOffset.Result<any>
        ? PaginationByOffset.Result<TEntity>
        : TResult extends PaginationByCursor.Result<any>
          ? PaginationByCursor.Result<TEntity>
          : NoPagination.Result<TEntity>;
