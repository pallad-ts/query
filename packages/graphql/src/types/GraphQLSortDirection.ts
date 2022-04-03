import {GraphQLEnumType} from "graphql";

export const GraphQLSortDirection = new GraphQLEnumType({
	name: 'SortDirection',
	values: {
		ASC: {
			value: 'ASC'
		},
		DESC: {
			value: 'DESC'
		}
	}
});
