import {InputTypeComposerFieldConfigMapDefinition} from "graphql-compose/lib/InputTypeComposer";
import {ComposeInputType} from "graphql-compose/lib/utils/typeHelpers";
import {InputTypeComposer} from "graphql-compose";
import {GraphQLInputObjectType, GraphQLNonNull} from "graphql";

export function createQueryType<TContext>({baseName, filtersType, paginationFields, sortType}: createQueryType.Options<TContext>) {
	const wrappedFiltersType = filtersType instanceof GraphQLInputObjectType ? new GraphQLNonNull(filtersType) : filtersType.NonNull;
	return InputTypeComposer.createTemp<TContext>({
		name: `${baseName}_Query`,
		fields: {
			filters: {type: wrappedFiltersType},
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
