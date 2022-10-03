import {InputTypeComposerFieldConfigMapDefinition} from "graphql-compose/lib/InputTypeComposer";
import {ComposeInputType} from "graphql-compose/lib/utils/typeHelpers";
import {InputTypeComposer} from "graphql-compose";
import {GraphQLInputObjectType} from "graphql";

export function createQueryType<TContext>({baseName, filtersType, paginationFields, sortType}: createQueryType.Options<TContext>) {
	return InputTypeComposer.createTemp<TContext>({
		name: `${baseName}_Query`,
		fields: {
			filters: {type: filtersType},
			...(sortType ? {
				sortBy: {
					type: sortType
				}
			} : undefined),
			...paginationFields
		}
	});
}

export namespace createQueryType {
	export interface Options<TContext> {
		baseName: string;
		filtersType: GraphQLInputObjectType | InputTypeComposer<TContext>,
		paginationFields?: InputTypeComposerFieldConfigMapDefinition;
		sortType?: ComposeInputType;
	}
}
