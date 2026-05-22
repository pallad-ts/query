import { GraphQLBoolean, GraphQLNonNull, GraphQLObjectType } from "graphql";
import { GraphQLNonNegativeInt } from "graphql-scalars";

export const GraphQLPageInfoPaginationByOffset = new GraphQLObjectType({
	name: "PageInfo_ByOffset",
	fields: {
		limit: {
			description: "Maximum number of items requested for the current page.",
			type: new GraphQLNonNull(GraphQLNonNegativeInt),
		},
		offset: {
			description: "Zero-based number of items skipped before the current page.",
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
	},
});
