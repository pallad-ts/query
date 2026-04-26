import {
	NoPagination,
	PaginationByCursor,
	PaginationByOffset,
	Query,
	SortingMulti,
	SortingSingle,
} from "@pallad/query";
import { Builder } from "@pallad/builder";
import { ERRORS } from "./errors";
import { z } from "zod";
import { PaginationDescriptor } from "./PaginationDescriptor";
import { SortingDescriptor } from "./SortingDescriptor";
import { PaginationDescriptorByCursor } from "./PaginationDescriptorByCursor";
import { SortingDescriptorSingle } from "./SortingDescriptorSingle";
import { PaginationDescriptorByOffset } from "./PaginationDescriptorByOffset";
import { SortingDescriptorMulti } from "./SortingDescriptorMulti";

export class QueryDescriptor<
	TQueryInput extends Partial<Query<any>> = Partial<Query<unknown>>,
	TQuery extends Query<any> = Query<unknown>,
	TPaginationDescriptor extends PaginationDescriptor<any, any> = never,
	TSortingDescriptor extends SortingDescriptor<any, any, any> = never,
> extends Builder {
	#paginationDescriptor?: PaginationDescriptor<any, any>;
	#sortingDescriptor?: SortingDescriptor<any, any, any>;

	#schema?: z.ZodType<TQuery, TQueryInput>;
	#filtersSchema?: z.ZodTypeAny;

	#createSchema() {
		this.#validate();
		return z.object(Object.fromEntries(this.#schemaGenerator())) as never as z.ZodType<
			TQuery,
			TQueryInput
		>;
	}

	*#schemaGenerator(): Generator<[string, z.ZodType]> {
		if (this.#filtersSchema) {
			yield ["filters", this.#filtersSchema];
		}

		if (this.#paginationDescriptor) {
			yield* Object.entries((this.#paginationDescriptor.schema as z.ZodObject).shape);
		}

		if (this.#sortingDescriptor) {
			yield* Object.entries((this.#sortingDescriptor.schema as z.ZodObject).shape);
		}
	}

	get querySchema(): z.ZodType<TQuery, TQueryInput> {
		if (!this.#schema) {
			this.#schema = this.#createSchema();
		}
		return this.#schema;
	}

	filtersSchema<T extends z.ZodObject>(
		schema: T
	): QueryDescriptor<
		Omit<TQueryInput, "filters"> &
			(HasRequiredKeys<z.input<T>> extends true
				? { filters: z.input<T> }
				: { filters?: z.input<T> }),
		Omit<TQuery, "filters"> & { filters: z.infer<T> },
		TPaginationDescriptor,
		TSortingDescriptor
	> {
		this.#filtersSchema = schema;
		this.#reset();
		return this as never;
	}

	paginationByCursor(
		options?: PaginationDescriptorByCursor.Config
	): QueryDescriptor<
		TQueryInput & PaginationByCursor.Input,
		TQuery & PaginationByCursor,
		PaginationDescriptorByCursor,
		TSortingDescriptor
	> {
		this.#paginationDescriptor = new PaginationDescriptorByCursor(options);
		this.#reset();
		return this as never;
	}

	paginationByOffset(
		options?: PaginationDescriptorByOffset.Config
	): QueryDescriptor<
		TQueryInput & PaginationByOffset.Input,
		TQuery & PaginationByOffset,
		PaginationDescriptorByOffset,
		TSortingDescriptor
	> {
		this.#paginationDescriptor = new PaginationDescriptorByOffset(options);
		this.#reset();
		return this as never;
	}

	sortingBySingleField<TSortableField extends string>(
		config: SortingDescriptorSingle.Config<TSortableField>
	): QueryDescriptor<
		TQuery & SortingSingle.Input<TSortableField>,
		TQuery & SortingSingle<TSortableField>,
		TPaginationDescriptor,
		SortingDescriptorSingle<TSortableField>
	> {
		this.#sortingDescriptor = new SortingDescriptorSingle(config);
		this.#reset();
		return this as never;
	}

	sortingByMultipleFields<TSortableField extends string>(
		config: SortingDescriptorMulti.Config<TSortableField>
	): QueryDescriptor<
		TQueryInput & SortingMulti.Input<TSortableField>,
		TQuery & SortingMulti<TSortableField>,
		TPaginationDescriptor,
		SortingDescriptorMulti<TSortableField>
	> {
		this.#sortingDescriptor = new SortingDescriptorMulti(config);
		this.#reset();
		return this as never;
	}

	get paginationDescriptor() {
		return this.#paginationDescriptor;
	}

	get sortingDescriptor() {
		return this.#sortingDescriptor;
	}

	#reset() {
		this.#schema = undefined;
	}

	#validate() {
		if (this.#paginationDescriptor instanceof PaginationDescriptorByCursor) {
			if (!this.#sortingDescriptor) {
				throw ERRORS.MISSING_SINGLE_SORTING_FOR_CURSOR_PAGINATION.create();
			}

			if (this.#sortingDescriptor instanceof SortingDescriptorMulti) {
				throw ERRORS.MULTI_SORTING_NOT_ALLOWED_FOR_CURSOR_PAGINATION.create();
			}
		}
	}

	createQuery(input: TQueryInput): TQuery {
		return this.querySchema.parse(input);
	}

	createResult<T>(
		query: TQuery,
		entityList: T[],
		...args: [TPaginationDescriptor] extends [never]
			? []
			: [Parameters<TPaginationDescriptor["createInitialResult"]>[2]]
	): QueryDescriptor.ResultForEntityType<T, TPaginationDescriptor, TSortingDescriptor> {
		const result = this.#paginationDescriptor?.createInitialResult(
			query,
			entityList,
			args[0]
		) ?? { list: entityList };

		if (this.#sortingDescriptor) {
			Object.assign(result, this.#sortingDescriptor.createMeta(query));
		}
		return result;
	}
}

export namespace QueryDescriptor {
	export type QueryType<T extends QueryDescriptor<any, any, any, any>> =
		T extends QueryDescriptor<infer U> ? U : never;
	export type QueryInputType<T extends QueryDescriptor<any, any, any, any>> =
		T extends QueryDescriptor<any, infer U> ? U : never;
	export type ResultForEntityType<
		TEntity,
		TPaginationDescription extends PaginationDescriptor<any, any>,
		TSortingDescriptor extends SortingDescriptor<any, any, any>,
	> = ([TPaginationDescription] extends [never]
		? NoPagination.Result<TEntity>
		: TPaginationDescription extends PaginationDescriptorByCursor
			? PaginationByCursor.Result<TEntity>
			: PaginationByOffset.Result<TEntity>) &
		([TSortingDescriptor] extends [never] ? {} : ReturnType<TSortingDescriptor["createMeta"]>);

	export type PaginationDescriptorType<T extends QueryDescriptor<any, any, any, any>> =
		T extends QueryDescriptor<any, any, infer T2, any> ? T2 : never;

	export type SortingDescriptorType<T extends QueryDescriptor<any, any, any, any>> =
		T extends QueryDescriptor<any, any, any, infer T2> ? T2 : never;
}

type RequiredKeys<T extends object> = {
	[K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

type HasRequiredKeys<T extends object> = [RequiredKeys<T>] extends [never] ? false : true;
