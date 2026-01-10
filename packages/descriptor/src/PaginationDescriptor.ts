import { z } from "zod";

export const DEFAULT_LIMIT = 20;
export const DEFAULT_MAX_LIMIT = 1000;

export interface PaginationDescriptor<TInput, TOutput> {
	readonly type: string;
	readonly schema: z.ZodType<TOutput, TInput>;
}
