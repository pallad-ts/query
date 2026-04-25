import {
	ObjectTypeComposer,
	NonNullComposer,
	ObjectTypeComposerFieldConfigMapDefinition,
} from "graphql-compose";
import { PaginationByCursor } from "@pallad/query";

export function createResultMetaType({
	baseName,
	paginationFields,
	sortType,
	extraMetaFields,
}: createResultMetaType.Options) {
	const metaFields: ObjectTypeComposerFieldConfigMapDefinition<any, any> = {};
	if (paginationFields) {
		Object.assign(metaFields, paginationFields);
	}

	if (sortType) {
		Object.assign(metaFields, {
			sortBy: { type: sortType },
		});
	}

	if (extraMetaFields) {
		Object.assign(metaFields, extraMetaFields);
	}

	if (!Object.keys(metaFields).length) {
		return;
	}

	return ObjectTypeComposer.createTemp({
		name: `${baseName}_Result_Meta`,
		fields: metaFields,
	}).NonNull;
}

export namespace createResultMetaType {
	export interface Options {
		baseName: string;
		paginationFields?:
			| ObjectTypeComposerFieldConfigMapDefinition<PaginationByCursor.PageInfo, any>
			| ObjectTypeComposerFieldConfigMapDefinition<PaginableByOffset.ResultMeta, any>;
		sortType?: ObjectTypeComposer | NonNullComposer;
		extraMetaFields?: ObjectTypeComposerFieldConfigMapDefinition<any, any>;
	}
}
