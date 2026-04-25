import { z } from "zod";
import { SortingFieldDefinition } from "@pallad/query";
export function createSortingFieldSchema<T extends string>(fieldNames: readonly [T, ...T[]]) {
	return z.object({
		field: z.enum(fieldNames).describe("Field to sort by"),
		direction: z.enum(["ASC", "DESC"]).describe("Sort direction"),
	}) satisfies z.ZodType<SortingFieldDefinition<T>>;
}
