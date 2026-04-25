import { DEFAULT_LIMIT, DEFAULT_MAX_LIMIT, PaginationDescriptor } from "./PaginationDescriptor";
import { PaginationByOffset } from "@pallad/query";
import { createLimitSchema } from "./internal/createLimitSchema";
import { z } from "zod";

export class PaginationDescriptorByOffset implements PaginationDescriptor<
	PaginationByOffset.Input,
	PaginationByOffset
> {
	readonly defaultLimit: number;
	readonly maxLimit: number;
	readonly maxOffset?: number;
	readonly schema: z.ZodType<PaginationByOffset, PaginationByOffset.Input>;

	constructor(config?: PaginationDescriptorByOffset.Config) {
		this.defaultLimit = config?.defaultLimit ?? DEFAULT_LIMIT;
		this.maxLimit = config?.maxOffset ?? DEFAULT_MAX_LIMIT;
		this.maxOffset = config?.maxOffset;
		this.schema = z.object({
			offset: createOffsetSchema(config).default(0),
			limit: createLimitSchema(this.maxLimit, this.defaultLimit),
		});
		Object.freeze(this);
	}

	createInitialResult<T>(
		query: PaginationByOffset,
		list: T[],
		context: {
			hasNextPage: boolean;
			hasPreviousPage: boolean;
		}
	): PaginationByOffset.Result<T> {
		return {
			list,
			pageInfo: {
				limit: query.limit,
				offset: query.offset ?? 0,
				hasNextPage: context.hasNextPage,
				hasPreviousPage: context.hasPreviousPage,
			},
		};
	}
}

function createOffsetSchema(config?: PaginationDescriptorByOffset.Config) {
	let schema = z.number().int().nonnegative();
	if (config?.maxOffset !== undefined) {
		return schema.max(config.maxOffset);
	}
	return schema;
}

export namespace PaginationDescriptorByOffset {
	export interface Config {
		defaultLimit?: number;
		maxLimit?: number;
		maxOffset?: number;
	}
}
