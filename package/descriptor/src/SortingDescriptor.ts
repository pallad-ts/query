import { z } from "zod";

export interface SortingDescriptor<TSortableField extends string, TInput, TOutput> {
	readonly fields: [TSortableField, ...TSortableField[]];
	readonly schema: z.ZodType<TOutput, TInput>;
	createMeta(query: TOutput): any;
}
