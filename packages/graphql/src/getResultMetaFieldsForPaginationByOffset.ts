import { GraphQLNonNull } from "graphql";
import {GraphQLNonNegativeInt, GraphQLPositiveInt} from "graphql-scalars";
import { ObjectTypeComposerFieldConfigMapDefinition } from "graphql-compose/lib/ObjectTypeComposer";
import { PaginableByOffset } from "@pallad/query";

export function getResultMetaFieldsForPaginationByOffset(): ObjectTypeComposerFieldConfigMapDefinition<
	PaginableByOffset.ResultMeta,
	any
> {
	return {
		limit: { type: new GraphQLNonNull(GraphQLNonNegativeInt) },
		offset: { type: new GraphQLNonNull(GraphQLNonNegativeInt) },
	};
}
