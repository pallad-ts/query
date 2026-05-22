import { GraphQLEnumType, GraphQLNonNull } from "graphql";

import { GraphQLSortDirection } from "./GraphQLSortDirection";

export function getSortTypeFields(sortFieldType: GraphQLEnumType) {
	return {
		direction: {
			description: "Direction used to sort results.",
			type: new GraphQLNonNull(GraphQLSortDirection),
		},
		field: {
			description: "Field used to sort results.",
			type: new GraphQLNonNull(sortFieldType),
		},
	};
}
