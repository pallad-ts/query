import { GraphQLString } from "graphql";
import { GraphQLNonNegativeInt } from "graphql-scalars";
import { InputTypeComposerFieldConfigMapDefinition } from "graphql-compose/lib/InputTypeComposer";

export function getQueryFieldsForPaginationByCursor(): InputTypeComposerFieldConfigMapDefinition {
	return {
		after: { type: GraphQLString },
		before: { type: GraphQLString },
		limit: { type: GraphQLNonNegativeInt },
	};
}
