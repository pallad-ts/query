import { GraphQLString } from "graphql";
import { GraphQLPositiveInt } from "graphql-scalars";
import { InputTypeComposerFieldConfigMapDefinition } from "graphql-compose/lib/InputTypeComposer";

export function getQueryFieldsForPaginationByCursor(): InputTypeComposerFieldConfigMapDefinition {
	return {
		after: { type: GraphQLString },
		before: { type: GraphQLString },
		limit: { type: GraphQLPositiveInt },
	};
}
