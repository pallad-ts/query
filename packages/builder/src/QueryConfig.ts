import {PaginableByCursor, PaginableByOffset, Query, SortableFieldDefinition, SortableMulti, SortableSingle} from "@pallad/query";
import {Builder} from "@pallad/builder";
import {QueryBuilder} from "./QueryBuilder";
import {ERRORS} from "./errors";
import {ResultBuilder} from "./ResultBuilder";

function composeDefaultPaginationOptions<T extends Partial<Omit<QueryConfig.Pagination, 'type'>>>(options?: T) {
	return {
		...QueryConfig.defaultPaginationOptions,
		...(options || {})
	};
}

export class QueryConfig<TFilters, TQueryProperties, TResultMeta = unknown> extends Builder {
	private sorting?: QueryConfig.Sorting<any>;
	private pagination?: QueryConfig.Pagination;

	readonly query!: Query<TFilters> & TQueryProperties;
	readonly resultMeta!: TResultMeta;

	static defaultPaginationOptions: Omit<QueryConfig.Pagination, 'type'> = {
		defaultLimit: 50,
		maxLimit: 1000
	};

	cursorPagination(
		options?: Partial<Omit<QueryConfig.Pagination.ByCursor, 'type'>>
	): QueryConfig<TFilters, TQueryProperties & PaginableByCursor, TResultMeta & PaginableByCursor.ResultMeta> {
		this.pagination = {
			type: 'byCursor',
			...composeDefaultPaginationOptions(options)
		};

		return this as any;
	}

	offsetPagination(
		options?: Partial<Omit<QueryConfig.Pagination.ByOffset, 'type'>>
	): QueryConfig<TFilters, TQueryProperties & PaginableByOffset, TResultMeta & PaginableByOffset.ResultMeta> {
		this.pagination = {
			type: 'byOffset',
			...composeDefaultPaginationOptions(options)
		};
		return this as any;
	}

	getPagination() {
		return this.pagination;
	}

	singleSorting<TSortableField extends string>(
		sortableFields: TSortableField[],
		defaultSorting: SortableFieldDefinition<TSortableField>
	) {
		this.sorting = {
			type: 'single',
			sortableFields,
			defaultSorting
		};
		return this as unknown as QueryConfig<TFilters,
			TQueryProperties & SortableSingle<TSortableField>,
			TResultMeta & SortableSingle.ResultMeta<TSortableField>>;
	}

	multiSorting<TSortableField extends string>(
		sortableFields: TSortableField[],
		defaultSorting: Array<SortableFieldDefinition<TSortableField>>
	) {
		this.sorting = {
			type: 'multi',
			sortableFields,
			defaultSorting
		};
		return this as unknown as QueryConfig<TFilters,
			TQueryProperties & SortableMulti<TSortableField>,
			TResultMeta & SortableMulti.ResultMeta<TSortableField>>;
	}

	getSorting() {
		return this.sorting;
	}

	filters<T>() {
		return this as unknown as QueryConfig<T, TQueryProperties>;
	}

	getQueryBuilder(): QueryBuilder<this> {
		this.validate();
		return new QueryBuilder(this);
	}

	validate() {
		if (this.pagination && this.pagination.type === 'byCursor') {
			if (!this.sorting) {
				throw ERRORS.MISSING_SINGLE_SORTING_FOR_CURSOR_PAGINATION();
			}

			if (this.sorting.type === 'multi') {
				throw ERRORS.MULTI_SORTING_FOR_ALLOWED_FOR_CURSOR_PAGINATION();
			}
		}
	}

	getResultBuilder(): ResultBuilder<this> {
		this.validate();
		return new ResultBuilder(this);
	}
}

export namespace QueryConfig {
	export type Pagination = Pagination.ByCursor | Pagination.ByOffset;
	export namespace Pagination {
		export interface ByCursor {
			type: 'byCursor';
			defaultLimit: number;
			maxLimit: number;
		}

		export interface ByOffset {
			type: 'byOffset';
			defaultLimit: number;
			maxLimit: number;
		}
	}

	export type Sorting<TSortableField extends string> = Sorting.Single<TSortableField> | Sorting.Multi<TSortableField>;
	export namespace Sorting {
		export interface Single<TSortableField extends string> {
			type: 'single';
			sortableFields: TSortableField[];
			defaultSorting: SortableFieldDefinition<TSortableField>
		}

		export interface Multi<TSortableField extends string> {
			type: 'multi';
			sortableFields: readonly TSortableField[];
			defaultSorting: Array<SortableFieldDefinition<TSortableField>>;
		}
	}
}
