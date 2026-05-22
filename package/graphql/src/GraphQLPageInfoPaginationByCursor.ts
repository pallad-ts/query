import { Cursor } from "@pallad/cursor-encoder";
import { GraphQLCursor } from "@pallad/cursor-encoder-graphql";
import { GraphQLBoolean, GraphQLNonNull, GraphQLObjectType, GraphQLScalarType } from "graphql";
import { GraphQLNonNegativeInt } from "graphql-scalars";

export function createGraphQLCursorType(cursorType: GraphQLScalarType<Cursor<any>, any>) {
	return new GraphQLObjectType({
		name: "PageInfo_ByCursor",
		fields: {
			limit: {
				description: "Maximum number of items requested for the current page.",
				type: new GraphQLNonNull(GraphQLNonNegativeInt),
			},
			hasNextPage: {
				description: "Whether more items exist after the current page.",
				type: new GraphQLNonNull(GraphQLBoolean),
			},
			hasPreviousPage: {
				description: "Whether more items exist before the current page.",
				type: new GraphQLNonNull(GraphQLBoolean),
			},
			startCursor: {
				description: "Cursor for the first item in the current page.",
				type: cursorType,
			},
			endCursor: {
				description: "Cursor for the last item in the current page.",
				type: cursorType,
			},
		},
	});
}

export const GraphQLPageInfoPaginationByCursor = createGraphQLCursorType(GraphQLCursor);
