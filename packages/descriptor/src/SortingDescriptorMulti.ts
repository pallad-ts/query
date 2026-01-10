import { SortingDescriptor } from "./SortingDescriptor";
import { SortingFieldDefinition, SortingMulti } from "@pallad/query";
import { z } from "zod";
import { createSortingFieldSchema } from "./internal/createSortingFieldSchema";

export class SortingDescriptorMulti<TField extends string> implements SortingDescriptor<
	TField,
	SortingMulti.Input<TField>,
	SortingMulti<TField>
> {
	readonly type = "MULTI";
	readonly fields: [TField, ...TField[]];
	readonly defaultSorting: Array<SortingFieldDefinition<TField>>;

	readonly schema: z.ZodType<SortingMulti<TField>, SortingMulti.Input<TField>>;
	constructor(config: SortingDescriptorMulti.Config<TField>) {
		this.fields = config.sortableFields;
		this.defaultSorting = config.defaultSorting;

		this.schema = z.object({
			sortBy: createSortingFieldSchema(this.fields)
				.array()
				.nonempty()
				.default(this.defaultSorting),
		});
	}
}

export namespace SortingDescriptorMulti {
	export interface Config<TField extends string> {
		sortableFields: [TField, ...TField[]];
		defaultSorting: Array<SortingFieldDefinition<TField>>;
	}
}
