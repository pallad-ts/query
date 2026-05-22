import { GraphQLEnumType, GraphQLList, GraphQLNonNull, GraphQLObjectType } from "graphql";

import { getSortTypeFields } from "./getSortTypeFields";

export function createResultSortType({
	baseName,
	sortFieldType,
	isMulti,
}: createResultSortType.Options) {
	const type = new GraphQLObjectType({
		name: `${baseName}_Result_Sort`,
		fields: getSortTypeFields(sortFieldType),
	});

	if (isMulti) {
		return new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(type)));
	}
	return new GraphQLNonNull(type);
}

export namespace createResultSortType {
	export interface Options {
		baseName: string;
		sortFieldType: GraphQLEnumType;
		/**
		 * Whether multiple sorting fields are allowed
		 */
		isMulti: boolean;
	}
}
