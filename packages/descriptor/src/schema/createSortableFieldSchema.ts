import { z } from "zod";
import { SortableFieldDefinition } from "@pallad/query";
export function createSortableFieldSchema<T extends string>(fieldNames: readonly [T, ...T[]]) {
	return z.object({
		field: z.enum(fieldNames).describe("Field to sort by"),
		direction: z.enum(["ASC", "DESC"]).describe("Sort direction"),
	}) satisfies z.ZodType<SortableFieldDefinition<T>>;
}
