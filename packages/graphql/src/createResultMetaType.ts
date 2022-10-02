import {ObjectTypeComposerFieldConfigMapDefinition} from "graphql-compose/lib/ObjectTypeComposer";
import {PaginableByCursor, PaginableByOffset} from "@pallad/query";
import {ObjectTypeComposer} from "graphql-compose";
import {NonNullComposer} from "graphql-compose/lib/NonNullComposer";

export function createResultMetaType({baseName, paginationFields, sortType, extraMetaFields}: createResultMetaType.Options) {
	const metaFields: ObjectTypeComposerFieldConfigMapDefinition<any, any> = {};
	if (paginationFields) {
		Object.assign(metaFields, paginationFields);
	}

	if (sortType) {
		Object.assign(metaFields, {
			sortBy: {type: sortType}
		})
	}

	if (extraMetaFields) {
		Object.assign(metaFields, extraMetaFields);
	}

	if (!Object.keys(metaFields).length) {
		return;
	}

	return ObjectTypeComposer.createTemp({
		name: `${baseName}_Result_Meta`,
		fields: metaFields
	}).NonNull;
}

export namespace createResultMetaType {
	export interface Options {
		baseName: string;
		paginationFields?: ObjectTypeComposerFieldConfigMapDefinition<PaginableByCursor.ResultMeta | PaginableByOffset.ResultMeta, unknown>,
		sortType?: ObjectTypeComposer | NonNullComposer;
		extraMetaFields?: ObjectTypeComposerFieldConfigMapDefinition<unknown, unknown>
	}
}
