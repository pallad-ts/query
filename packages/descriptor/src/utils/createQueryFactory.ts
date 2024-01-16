import { z } from "zod";
import { fromNullable } from "@sweet-monads/maybe";
import { QueryDescriptor } from "../QueryDescriptor";
import { fromZodValidation } from "@pallad/violations-zod";
import { right } from "@sweet-monads/either";

export function createQueryFactory(
	config: QueryDescriptor.Config,
	filtersValidator: QueryDescriptor.FiltersValidator<any> | undefined
) {
	const paginationSchema = getPaginationSchema(config.pagination);
	const sortingSchema = getSortingSchema(config.sorting);

	let schema = z.object({
		filters: z
			.object({})
			.passthrough()
			.default(() => ({})),
	});

	schema = paginationSchema.fold(
		() => schema,
		extraSchema => schema.merge(extraSchema)
	);
	schema = sortingSchema.fold(
		() => schema,
		extraSchema => schema.merge(extraSchema)
	);

	return (input: unknown) => {
		return fromZodValidation(schema, input).chain(({ filters, ...meta }) => {
			if (filtersValidator) {
				return filtersValidator(filters).map(filters => ({ ...meta, filters }));
			}
			return right({ ...meta, filters });
		});
	};
}

function createSortableFieldSchema(allowedFields: readonly [string, ...string[]]) {
	return z.object({
		field: z.enum(allowedFields),
		direction: z.enum(["DESC", "ASC"]),
	});
}

function getPaginationSchema(pagination: QueryDescriptor.Pagination | undefined) {
	return fromNullable(pagination).map(x => {
		if (x.type === "byCursor") {
			return z.object({
				limit: getLimitSchema(x),
				after: z.string().optional(),
				before: z.string().optional(),
			});
		}
		return z.object({
			limit: getLimitSchema(x),
			offset: z.number().int().min(0).default(0),
		});
	});
}

function getLimitSchema(pagination: QueryDescriptor.Pagination) {
	return z.number().int().min(1).max(pagination.maxLimit).default(pagination.defaultLimit);
}

function getSortingSchema(sorting: QueryDescriptor.Sorting<any> | undefined) {
	return fromNullable(sorting).map(x => {
		const sortByType = createSortableFieldSchema(x.sortableFields);
		if (x.type === "single") {
			return z.object({
				sortBy: sortByType.default(x.defaultSorting),
			});
		}

		return z.object({
			sortBy: z
				.array(sortByType)
				.nonempty()
				.default(x.defaultSorting as [any, ...any[]]),
		});
	});
}
