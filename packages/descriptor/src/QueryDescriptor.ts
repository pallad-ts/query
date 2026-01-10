import { Query, SortableFieldDefinition, SortingSingle, SortingMulti } from "@pallad/query";
import { Builder } from "@pallad/builder";
import { ERRORS } from "./errors";
import { createResult } from "./utils/createResult";
import { validateSortableFields } from "./utils/validateSortableFields";
import { z } from "zod";
import { PaginationByCursor, PaginationByOffset } from "@pallad/query";
import { createPaginationCursorSchema } from "./schema/createPaginationCursorSchema";
import { createPaginationOffsetSchema } from "./schema/createPaginationOffsetSchema";
import { createSortingSingleSchema } from "./schema/createSortingSingleSchema";
import { createSortingMultiSchema } from "./schema/createSortingMultiSchema";
import {
	PaginationDescriptor,
	PaginationDescriptorCursor,
	PaginationDescriptorByOffset,
} from "./PaginationDescriptor";
import { SortingDescriptor } from "./SortingDescriptor";
import { PaginationDescriptorByCursor } from "./PaginationDescriptorByCursor";
function composeDefaultPaginationOptions<T extends Partial<Omit<PaginationDescriptor, "type">>>(
	options?: T
) {
	return {
		...QueryDescriptor.defaultPaginationOptions,
		...(options || {}),
	};
}

export class QueryDescriptor<
	TQueryInput extends Partial<Query<any>> = Partial<Query<unknown>>,
	TQuery extends Query<any> = Query<unknown>,
> extends Builder {
	#config: {
		pagination: PaginationDescriptor | undefined;
		sorting: SortingDescriptor<any> | undefined;
	} = {
		pagination: undefined,
		sorting: undefined,
	};
	#paginationDescriptor?: PaginationDescriptor<any, any>;
	#schema?: z.ZodType<TQuery, TQueryInput>;
	#filtersSchema?: z.ZodTypeAny;

	static defaultPaginationOptions: Omit<PaginationDescriptor, "type"> = {
		defaultLimit: 50,
		maxLimit: 1000,
	};

	get schema() {
		if (!this.#schema) {
			this.#schema = this.#createSchema();
		}
		return this.#schema;
	}

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

		if (this.#config.pagination?.type === "CURSOR") {
			yield* Object.entries(createPaginationCursorSchema(this.#config.pagination).shape);
		} else if (this.#config.pagination?.type === "OFFSET") {
			yield* Object.entries(createPaginationOffsetSchema(this.#config.pagination).shape);
		}

		if (this.#config.sorting?.type === "SINGLE") {
			yield* Object.entries(createSortingSingleSchema(this.#config.sorting).shape);
		} else if (this.#config.sorting?.type === "MULTI") {
			yield* Object.entries(createSortingMultiSchema(this.#config.sorting).shape);
		}
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
		this.#paginationDescriptor = new PaginationDescriptorByCursor(options)
		this.#reset();
		return this as never;
	}

	paginationOffset(
		options?: Partial<Omit<PaginationDescriptorByOffset, "type">>
	): QueryDescriptor<TQueryInput & PaginationByOffset.Input, TQuery & PaginationByOffset> {
		this.#config.pagination = {
			type: "OFFSET",
			...composeDefaultPaginationOptions(options),
		};
		this.#reset();
		return this as never;
	}

	singleSorting<TSortableField extends string>(
		sortableFields: TSortableField[],
		defaultSorting: SortableFieldDefinition<TSortableField>
	): QueryDescriptor<
		TQuery & SortingSingle.Input<TSortableField>,
		TQuery & SortingSingle<TSortableField>
	> {
		validateSortableFields(sortableFields);
		this.#config.sorting = {
			type: "SINGLE",
			sortableFields,
			defaultSorting,
		};
		this.#reset();
		return this as never;
	}

	sortingMulti<TSortableField extends string>(
		sortableFields: TSortableField[],
		defaultSorting: Array<SortableFieldDefinition<TSortableField>>
	): QueryDescriptor<
		TQueryInput & SortingMulti.Input<TSortableField>,
		TQuery & SortingMulti<TSortableField>
	> {
		validateSortableFields(sortableFields);
		this.#config.sorting = {
			type: "MULTI",
			sortableFields,
			defaultSorting,
		};
		this.#reset();
		return this as never;
	}

	get sortingConfig() {
		return this.#config.sorting;
	}

	get paginationConfig() {
		return this.#config.pagination;
	}

	#reset() {
		this.#schema = undefined;
	}

	#validate() {
		if (this.#config.pagination && this.#config.pagination.type === "CURSOR") {
			if (!this.#config.sorting) {
				throw ERRORS.MISSING_SINGLE_SORTING_FOR_CURSOR_PAGINATION.create();
			}

			if (this.#config.sorting.type === "MULTI") {
				throw ERRORS.MULTI_SORTING_NOT_ALLOWED_FOR_CURSOR_PAGINATION.create();
			}
		}
	}

	createResult<T>(query: TQuery, list: T[]) {}
}

type RequiredKeys<T extends object> = {
	[K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

type HasRequiredKeys<T extends object> = [RequiredKeys<T>] extends [never] ? false : true;
