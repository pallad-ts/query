import { GraphQLEnumType, GraphQLInputObjectType, GraphQLList, GraphQLNonNull } from "graphql";

import { getSortTypeFields } from "./getSortTypeFields";

/**
 * Creates `sort` type suitable for use as input
 */
export function createInputSortType({
	baseName,
	sortFieldType,
	isMulti,
}: createInputSortType.Options) {
	const type = new GraphQLInputObjectType({
		name: `${baseName}_Query_Sort_Input`,
		fields: getSortTypeFields(sortFieldType),
	});

	if (isMulti) {
		return new GraphQLList(new GraphQLNonNull(type));
	}
	return type;
}

export namespace createInputSortType {
	export interface Options {
		baseName: string;
		sortFieldType: GraphQLEnumType;
		/**
		 * Whether multiple sorting fields are allowed
		 */
		isMulti: boolean;
	}
}
