import {
	PaginableByCursor,
	PaginableByOffset,
	Query,
	SortableFieldDefinition,
	SortableSingle,
	Result as _Result,
	SortableMulti,
	ResultMeta,
} from "@pallad/query";
import { Builder } from "@pallad/builder";
import { ERRORS } from "./errors";
import { createResult } from "./utils/createResult";
import { validateSortableFields } from "./utils/validateSortableFields";
import { Either } from "@sweet-monads/either";
import { ValidationViolationError, ViolationsList } from "@pallad/violations";
import { createQueryFactory } from "./utils/createQueryFactory";

function composeDefaultPaginationOptions<
	T extends Partial<Omit<QueryDescriptor.Pagination, "type">>,
>(options?: T) {
	return {
		...QueryDescriptor.defaultPaginationOptions,
		...(options || {}),
	};
}

export class QueryDescriptor<
	TQuery extends Query<any> = Query<unknown>,
	TConfig extends QueryDescriptor.Config = {
		pagination: undefined;
		sorting: undefined;
	},
> extends Builder {
	#config: TConfig;

	#filtersValidation?: QueryDescriptor.FiltersValidator<unknown>;
	#queryFactory?: (input: unknown) => Either<ViolationsList, TQuery>;

	static defaultPaginationOptions: Omit<QueryDescriptor.Pagination, "type"> = {
		defaultLimit: 50,
		maxLimit: 1000,
	};

	constructor() {
		super();

		this.#config = {
			pagination: undefined,
			sorting: undefined,
		} as TConfig;
	}

	cursorPagination(options?: Partial<Omit<QueryDescriptor.Pagination.ByCursor, "type">>) {
		this.#config.pagination = {
			type: "byCursor",
			...composeDefaultPaginationOptions(options),
		};
		this.#reset();
		return this as unknown as QueryDescriptor<
			TQuery & PaginableByCursor,
			Omit<TConfig, "pagination"> & { pagination: QueryDescriptor.Pagination.ByCursor }
		>;
	}

	offsetPagination(options?: Partial<Omit<QueryDescriptor.Pagination.ByOffset, "type">>) {
		this.#config.pagination = {
			type: "byOffset",
			...composeDefaultPaginationOptions(options),
		};
		this.#reset();
		return this as unknown as QueryDescriptor<
			TQuery & PaginableByOffset,
			Omit<TConfig, "pagination"> & { pagination: QueryDescriptor.Pagination.ByOffset }
		>;
	}

	filtersValidator<TFilters>(validation: QueryDescriptor.FiltersValidator<TFilters>) {
		this.#filtersValidation = validation;
		this.#reset();
		return this as QueryDescriptor<Omit<TQuery, "filters"> & Query<TFilters>, TConfig>;
	}

	singleSorting<TSortableField extends string>(
		sortableFields: TSortableField[],
		defaultSorting: SortableFieldDefinition<TSortableField>
	) {
		validateSortableFields(sortableFields);
		this.#config.sorting = {
			type: "single",
			sortableFields,
			defaultSorting,
		};
		this.#reset();
		return this as unknown as QueryDescriptor<
			TQuery & SortableSingle<TSortableField>,
			Omit<TConfig, "sorting"> & {
				sorting: QueryDescriptor.Sorting.Single<TSortableField>;
			}
		>;
	}

	multiSorting<TSortableField extends string>(
		sortableFields: TSortableField[],
		defaultSorting: Array<SortableFieldDefinition<TSortableField>>
	) {
		validateSortableFields(sortableFields);
		this.#config.sorting = {
			type: "multi",
			sortableFields,
			defaultSorting,
		};
		this.#reset();
		return this as unknown as QueryDescriptor<
			TQuery & SortableMulti<TSortableField>,
			Omit<TConfig, "sorting"> & {
				sorting: QueryDescriptor.Sorting.Multi<TSortableField>;
			}
		>;
	}

	get sortingConfig() {
		return this.#config.sorting;
	}

	get paginationConfig() {
		return this.#config.pagination;
	}

	#reset() {
		this.#queryFactory = undefined;
	}

	validate() {
		if (this.#config.pagination && this.#config.pagination.type === "byCursor") {
			if (!this.#config.sorting) {
				throw ERRORS.MISSING_SINGLE_SORTING_FOR_CURSOR_PAGINATION.create();
			}

			if (this.#config.sorting.type === "multi") {
				throw ERRORS.MULTI_SORTING_FOR_ALLOWED_FOR_CURSOR_PAGINATION.create();
			}
		}
	}

	createResult<TEntity>(
		options: QueryDescriptor.ResultOptions<TEntity, TQuery, TConfig["pagination"]>
	) {
		this.validate();
		return createResult(this.#config, options) as QueryDescriptor.Result<TEntity, TConfig>;
	}

	createQuery(input: unknown): Either<ViolationsList, TQuery> {
		if (!this.#queryFactory) {
			this.#queryFactory = createQueryFactory(this.#config, this.#filtersValidation) as (
				input: unknown
			) => Either<ViolationsList, TQuery>;
		}

		return this.#queryFactory(input);
	}

	createQueryOrFail(input: unknown, errorMessage?: string): TQuery {
		const result = this.createQuery(input);
		if (result.isLeft()) {
			throw new ValidationViolationError(result.value, errorMessage ?? "Invalid query");
		}
		return result.value;
	}
}

export namespace QueryDescriptor {
	export interface Config {
		pagination: Pagination | undefined;
		sorting: Sorting<any> | undefined;
	}

	export type QueryType<T extends QueryDescriptor<any, any>> =
		T extends QueryDescriptor<infer TQuery, any> ? TQuery : never;

	export type Pagination = Pagination.ByCursor | Pagination.ByOffset;
	export namespace Pagination {
		export interface ByCursor {
			type: "byCursor";
			defaultLimit: number;
			maxLimit: number;
		}

		export interface ByOffset {
			type: "byOffset";
			defaultLimit: number;
			maxLimit: number;
		}
	}

	export type Sorting<TSortableField extends string> =
		| Sorting.Single<TSortableField>
		| Sorting.Multi<TSortableField>;
	export namespace Sorting {
		export interface Single<TSortableField extends string> {
			type: "single";
			sortableFields: readonly [TSortableField, ...TSortableField[]];
			defaultSorting: SortableFieldDefinition<TSortableField>;
		}

		export interface Multi<TSortableField extends string> {
			type: "multi";
			sortableFields: readonly [TSortableField, ...TSortableField[]];
			defaultSorting: Array<SortableFieldDefinition<TSortableField>>;
		}
	}

	export type ResultOptions<
		TEntity,
		TQuery extends Query<any>,
		TPagination extends Pagination | undefined,
	> = ResultOptions.Base<TEntity, TQuery> &
		(TPagination extends Pagination.ByCursor
			? {
					nextPageCursor?: string;
					previousPageCursor?: string;
				}
			: {});
	export namespace ResultOptions {
		export interface Base<TEntity, TQuery extends Query<any>> {
			results: TEntity[];
			query: TQuery;
		}
	}

	export type ResultMetaType<T extends QueryDescriptor<any, any>> =
		ReturnType<T["createResult"]> extends { meta: infer TMeta } ? TMeta : never;

	export type Result<TEntity, TConfig extends Config> = _Result<TEntity> & Result.Meta<TConfig>;

	export namespace Result {
		export type Meta<T extends Config> = T extends { pagination: undefined; sorting: undefined }
			? {}
			: ResultMeta<MetaPagination<T["pagination"]> & MetaSorting<T["sorting"]>>;

		export type MetaPagination<T extends Pagination | undefined> = T extends undefined
			? {}
			: T extends Pagination.ByCursor
				? PaginableByCursor.ResultMeta
				: PaginableByOffset.ResultMeta;

		export type MetaSorting<T extends Sorting<any> | undefined> = T extends undefined
			? {}
			: T extends Sorting.Single<infer TField>
				? SortableSingle.ResultMeta<TField>
				: T extends Sorting.Multi<infer TField>
					? SortableMulti.ResultMeta<TField>
					: {};
	}

	export type FiltersValidator<TFilters> = (input: unknown) => Either<ViolationsList, TFilters>;
}
