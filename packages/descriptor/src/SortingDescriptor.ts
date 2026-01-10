import { z } from "zod";

export interface SortingDescriptor<TSortableField extends string, TInput, TOutput> {
	type: string;
	fields: readonly [TSortableField, ...TSortableField[]];
	readonly schema: z.ZodType<TOutput, TInput>;
}
