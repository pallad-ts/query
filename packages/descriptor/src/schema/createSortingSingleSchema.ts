import { SortingDescriptorSingle } from "../SortingDescriptor";
import { z } from "zod";
import { SortingSingle } from "@pallad/query";
import { createSortableFieldSchema } from "./createSortableFieldSchema";
export function createSortingSingleSchema<T extends string>(
	descriptor: SortingDescriptorSingle<T>
) {
	return z.object({
		sortBy: createSortableFieldSchema(descriptor.sortableFields).describe(
			"Sorting field and direction"
		),
	}) satisfies z.ZodType<SortingSingle<T>, SortingSingle.Input<T>>;
}
