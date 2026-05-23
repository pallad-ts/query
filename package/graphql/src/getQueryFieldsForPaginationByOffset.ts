import { GraphQLInputFieldConfigMap } from "graphql";
import { GraphQLNonNegativeInt } from "graphql-scalars";

export function getQueryFieldsForPaginationByOffset(): GraphQLInputFieldConfigMap {
	return {
		limit: {
			description: "Maximum number of items to return.",
			type: GraphQLNonNegativeInt,
		},
		offset: {
			description: "Zero-based number of items to skip before returning results.",
			type: GraphQLNonNegativeInt,
		},
	};
}
