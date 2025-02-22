import { GraphQLNonNull, GraphQLString } from "graphql";
import {GraphQLNonNegativeInt, GraphQLPositiveInt} from "graphql-scalars";
import { ObjectTypeComposerFieldConfigMapDefinition } from "graphql-compose/lib/ObjectTypeComposer";
import { PaginableByCursor } from "@pallad/query";

export function getResultMetaFieldsForPaginationByCursor(): ObjectTypeComposerFieldConfigMapDefinition<
	PaginableByCursor.ResultMeta,
	any
> {
	return {
		nextPage: { type: GraphQLString },
		previousPage: { type: GraphQLString },
		limit: { type: new GraphQLNonNull(GraphQLNonNegativeInt) },
	};
}
