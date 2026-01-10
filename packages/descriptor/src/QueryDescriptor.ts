import { Query, SortingSingle, SortingMulti } from "@pallad/query";
import { Builder } from "@pallad/builder";
import { ERRORS } from "./errors";
import { z } from "zod";
import { PaginationByCursor, PaginationByOffset } from "@pallad/query";
import { PaginationDescriptor } from "./PaginationDescriptor";
import { SortingDescriptor } from "./SortingDescriptor";
import { PaginationDescriptorByCursor } from "./PaginationDescriptorByCursor";
import { SortingDescriptorSingle } from "./SortingDescriptorSingle";
import { PaginationDescriptorByOffset } from "./PaginationDescriptorByOffset";
import { SortingDescriptorMulti } from "./SortingDescriptorMulti";
export class QueryDescriptor<
	TQueryInput extends Partial<Query<any>> = Partial<Query<unknown>>,
	TQuery extends Query<any> = Query<unknown>,
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
		Omit<TQuery, "filters"> & { filters: z.infer<T> }
	> {
		this.#filtersSchema = schema;
		this.#reset();
		return this as never;
	}

	paginationByCursor(
		options?: PaginationDescriptorByCursor.Config
	): QueryDescriptor<TQueryInput & PaginationByCursor.Input, TQuery & PaginationByCursor> {
		this.#paginationDescriptor = new PaginationDescriptorByCursor(options);
		this.#reset();
		return this as never;
	}

	paginationByOffset(
		options?: PaginationDescriptorByOffset.Config
	): QueryDescriptor<TQueryInput & PaginationByOffset.Input, TQuery & PaginationByOffset> {
		this.#paginationDescriptor = new PaginationDescriptorByOffset(options);
		this.#reset();
		return this as never;
	}

	sortingBySingleField<TSortableField extends string>(
		config: SortingDescriptorSingle.Config<TSortableField>
	): QueryDescriptor<
		TQuery & SortingSingle.Input<TSortableField>,
		TQuery & SortingSingle<TSortableField>
	> {
		this.#sortingDescriptor = new SortingDescriptorSingle(config);
		this.#reset();
		return this as never;
	}

	sortingByMultipleFields<TSortableField extends string>(
		config: SortingDescriptorMulti.Config<TSortableField>
	): QueryDescriptor<
		TQueryInput & SortingMulti.Input<TSortableField>,
		TQuery & SortingMulti<TSortableField>
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
		if (this.#paginationDescriptor?.type === "CURSOR") {
			if (!this.#sortingDescriptor) {
				throw ERRORS.MISSING_SINGLE_SORTING_FOR_CURSOR_PAGINATION.create();
			}

			if (this.#sortingDescriptor.type === "MULTI") {
				throw ERRORS.MULTI_SORTING_NOT_ALLOWED_FOR_CURSOR_PAGINATION.create();
			}
		}
	}

	createQuery(input: TQueryInput): TQuery {
		return this.querySchema.parse(input);
	}

	createResult<T>(query: TQuery, list: T[]) {}
}

export namespace QueryDescriptor {
	export type Query<T extends QueryDescriptor<any, any>> =
		T extends QueryDescriptor<infer U> ? U : never;
	export type QueryInput<T extends QueryDescriptor<any, any>> =
		T extends QueryDescriptor<any, infer U> ? U : never;
}

type RequiredKeys<T extends object> = {
	[K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

type HasRequiredKeys<T extends object> = [RequiredKeys<T>] extends [never] ? false : true;
