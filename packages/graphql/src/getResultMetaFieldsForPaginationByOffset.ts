import {GraphQLNonNull} from "graphql";
import {GraphQLPositiveInt} from "graphql-scalars";
import {ObjectTypeComposerFieldConfigMapDefinition} from "graphql-compose/lib/ObjectTypeComposer";
import {PaginableByOffset} from "@pallad/query";

export function getResultMetaFieldsForPaginationByOffset(): ObjectTypeComposerFieldConfigMapDefinition<PaginableByOffset.ResultMeta, any> {
	return {
		limit: {type: new GraphQLNonNull(GraphQLPositiveInt)},
		offset: {type: new GraphQLNonNull(GraphQLPositiveInt)}
	};
}
