import * as isPred from 'predicates';

export interface Query<TFilters> {
    filters: TFilters;
}

const isByOffset = isPred.struct({
    limit: isPred.num,
    offset: isPred.undefinedOr(isPred.num)
});

const isSortable = isPred.prop('sortBy', isPred.array);

const isByNode = isPred.all(
    isPred.prop('limit', Number),
    isPred.any(
        isPred.prop('after', isPred.defined),
        isPred.prop('before', isPred.defined)
    )
);

export namespace Query {
    export interface Result<TResult, TMeta = any | undefined> {
        results: TResult[]
        meta: TMeta;
    }

    export type OmitFiltersKeys<TQuery extends Query<any>,
        TRemovedKeys extends keyof TQuery['filters']> =
        Omit<TQuery, 'filters'>
        & Query<Omit<TQuery['filters'], TRemovedKeys>>;

    export type OptionalFiltersKeys<TQuery extends Query<any>,
        TOptionalKeys extends keyof TQuery['filters']> =
        Omit<TQuery, 'filters'>
        & Query<Omit<TQuery['filters'], TOptionalKeys> &
        Partial<Pick<TQuery['filters'], TOptionalKeys>>>;

    export interface Sortable<TField = string> {
        sortBy: Array<Sortable.Definition<TField>>;
    }

    export namespace Sortable {
        export interface Definition<TField = string> {
            field: TField;
            direction: Direction;
        }

        export type Direction = 'ASC' | 'DESC';

        export function is<TField = string>(value: any): value is Sortable<TField> {
            return isSortable(value);
        }
    }

    export interface SingleSortable<TField = string> {
        sortBy: Sortable.Definition<TField>;
    }

    export namespace Paginable {
        export type ByNode<TId = string> = Partial<{ after: TId } | { before: TId }> & { limit: number };

        export namespace ByNode {
            export function is<TId = string>(value: any): value is ByNode<TId> {
                return isByNode(value);
            }
        }

        export interface ByOffset {
            offset?: number;
            limit: number;
        }

        export namespace ByOffset {
            export function is(value: any): value is ByOffset {
                return isByOffset(value);
            }
        }
    }
}
