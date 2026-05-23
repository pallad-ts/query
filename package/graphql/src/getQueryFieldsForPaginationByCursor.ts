import { GraphQLCursor } from "@pallad/cursor-encoder-graphql";
import { GraphQLInputFieldConfigMap } from "graphql";
import { GraphQLNonNegativeInt } from "graphql-scalars";

export function getQueryFieldsForPaginationByCursor(): GraphQLInputFieldConfigMap {
	return {
		after: {
			description: "Return items after this cursor.",
			type: GraphQLCursor,
		},
		before: {
			description: "Return items before this cursor.",
			type: GraphQLCursor,
		},
		limit: {
			description: "Maximum number of items to return.",
			type: GraphQLNonNegativeInt,
		},
	};
}
