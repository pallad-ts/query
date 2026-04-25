import { DEFAULT_LIMIT, DEFAULT_MAX_LIMIT, PaginationDescriptor } from "./PaginationDescriptor";
import { PaginationByCursor, SortingSingle } from "@pallad/query";
import { createLimitSchema } from "./internal/createLimitSchema";
import { z } from "zod";
import { Cursor } from "@pallad/cursor-encoder";

function defaultIdExtractor<T>(item: T): string {
	if (item && typeof item === "object" && "id" in item && typeof item.id === "string") {
		return item.id;
	}

	throw new Error("Entity does not contain `id` field or it is not a string.");
}

export class PaginationDescriptorByCursor implements PaginationDescriptor<
	PaginationByCursor.Input,
	PaginationByCursor
> {
	readonly defaultLimit: number;
	readonly maxLimit: number;
	readonly schema: z.ZodType<PaginationByCursor, PaginationByCursor.Input>;

	constructor(limit?: PaginationDescriptorByCursor.Config) {
		this.defaultLimit = limit?.defaultLimit ?? DEFAULT_LIMIT;
		this.maxLimit = limit?.maxLimit ?? DEFAULT_MAX_LIMIT;
		this.schema = z.object({
			before: z.base64url().optional(),
			after: z.base64url().optional(),
			limit: createLimitSchema(this.maxLimit, this.defaultLimit),
		});
		Object.freeze(this);
	}

	createInitialResult<T>(
		query: PaginationByCursor | (PaginationByCursor & SortingSingle<string>),
		list: T[],
		context: {
			idExtractor?: (item: T) => string;
			hasNextPage: boolean;
			hasPreviousPage: boolean;
		}
	): PaginationByCursor.Result<T> {
		const idExtractor = context.idExtractor ?? defaultIdExtractor;
		const computeCursor = (item: T): Cursor<any> => {
			const baseCursor: Cursor<any> = {
				i: idExtractor(item),
			};

			if ("sortBy" in query && query.sortBy) {
				const key = item[query.sortBy.field as never];
				if (key) {
					baseCursor.k = key;
				}
			}

			return baseCursor;
		};

		return {
			edges: list.map(item => {
				return {
					node: item,
					cursor: computeCursor(item),
				};
			}),
			nodes: list,
			pageInfo: {
				hasNextPage: context.hasNextPage,
				hasPreviousPage: context.hasPreviousPage,
				limit: query.limit,
				startCursor: list.length > 0 ? computeCursor(list[0]) : undefined,
				endCursor: list.length > 0 ? computeCursor(list[list.length - 1]) : undefined,
			},
		};
	}
}

export namespace PaginationDescriptorByCursor {
	export interface Config {
		defaultLimit?: number;
		maxLimit?: number;
	}
}
