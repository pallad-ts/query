import { DEFAULT_LIMIT, DEFAULT_MAX_LIMIT, PaginationDescriptor } from "./PaginationDescriptor";
import { PaginationByOffset } from "@pallad/query";
import { createLimitSchema } from "./internal/createLimitSchema";
import { z } from "zod";

export class PaginationDescriptorByOffset
	implements PaginationDescriptor<PaginationByOffset.Input, PaginationByOffset>
{
	readonly type = "OFFSET";

	readonly defaultLimit: number;
	readonly maxLimit: number;
	readonly schema: z.ZodType<PaginationByOffset, PaginationByOffset.Input>;

	constructor(config: PaginationDescriptorByOffset.Config) {
		this.defaultLimit = config.defaultLimit ?? DEFAULT_LIMIT;
		this.maxLimit = config.maxLimit ?? DEFAULT_MAX_LIMIT;
		this.schema = z.object({
			offset: z.number().int().nonnegative().default(0),
			limit: createLimitSchema(this.maxLimit, this.defaultLimit),
		});
		Object.freeze(this);
	}
}

export namespace PaginationDescriptorByOffset {
	export interface Config {
		defaultLimit?: number;
		maxLimit?: number;
	}
}
