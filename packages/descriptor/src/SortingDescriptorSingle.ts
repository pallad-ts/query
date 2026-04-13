import { SortingDescriptor } from "./SortingDescriptor";
import { SortingFieldDefinition, SortingSingle } from "@pallad/query";
import { createSortingFieldSchema } from "./internal/createSortingFieldSchema";
import { z } from "zod";

export class SortingDescriptorSingle<TField extends string> implements SortingDescriptor<
	TField,
	SortingSingle.Input<TField>,
	SortingSingle<TField>
> {
	readonly fields: [TField, ...TField[]];
	readonly default: SortingFieldDefinition<TField>;
	readonly schema: z.ZodType<SortingSingle<TField>, SortingSingle.Input<TField>>;

	constructor(config: SortingDescriptorSingle.Config<TField>) {
		this.fields = config.fields;
		this.default = config.default;

		this.schema = z.object({
			sortBy: createSortingFieldSchema(this.fields).describe("Sorting field and direction"),
		});

		Object.freeze(this);
	}

	createMeta(query: SortingSingle<TField>): SortingSingle.ResultMeta<TField> {
		return {
			sortBy: query.sortBy,
		};
	}
}

export namespace SortingDescriptorSingle {
	export interface Config<TField extends string> {
		fields: [TField, ...TField[]];
		default: SortingFieldDefinition<TField>;
	}
}
