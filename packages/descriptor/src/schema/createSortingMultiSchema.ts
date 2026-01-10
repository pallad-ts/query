import { SortingDescriptorMulti } from "../SortingDescriptor";
import { z } from "zod";
import { SortingMulti } from "@pallad/query";
import { createSortableFieldSchema } from "./createSortableFieldSchema";
export function createSortingMultiSchema<T extends string>(descriptor: SortingDescriptorMulti<T>) {
	return z.object({
		sortBy: createSortableFieldSchema(descriptor.sortableFields)
			.array()
			.describe("List of sorting field and direction"),
	}) satisfies z.ZodType<SortingMulti<T>, SortingMulti.Input<T>>;
}
