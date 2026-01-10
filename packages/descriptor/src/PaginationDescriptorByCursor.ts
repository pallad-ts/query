import { DEFAULT_LIMIT, DEFAULT_MAX_LIMIT, PaginationDescriptor } from "./PaginationDescriptor";
import { PaginationByCursor } from "@pallad/query";
import { createLimitSchema } from "./internal/createLimitSchema";
import { z } from "zod";

export class PaginationDescriptorByCursor
	implements PaginationDescriptor<PaginationByCursor.Input, PaginationByCursor>
{
	readonly type = "CURSOR";

	readonly defaultLimit: number;
	readonly maxLimit: number;
	readonly schema: z.ZodType<PaginationByCursor, PaginationByCursor.Input>;

	constructor(config?: PaginationDescriptorByCursor.Config) {
		this.defaultLimit = config?.defaultLimit ?? DEFAULT_LIMIT;
		this.maxLimit = config?.maxLimit ?? DEFAULT_MAX_LIMIT;
		this.schema = z.object({
			before: z.base64url().optional(),
			after: z.base64url().optional(),
			limit: createLimitSchema(this.maxLimit, this.defaultLimit),
		});
		Object.freeze(this);
	}
}

export namespace PaginationDescriptorByCursor {
	export interface Config {
		defaultLimit?: number;
		maxLimit?: number;
	}
}
