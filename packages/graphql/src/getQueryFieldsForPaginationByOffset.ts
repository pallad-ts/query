import { GraphQLNonNegativeInt } from "graphql-scalars";
import { InputTypeComposerFieldConfigMapDefinition } from "graphql-compose/lib/InputTypeComposer";

export function getQueryFieldsForPaginationByOffset(): InputTypeComposerFieldConfigMapDefinition {
	return {
		limit: { type: GraphQLNonNegativeInt },
		offset: { type: GraphQLNonNegativeInt },
	};
}
