import {GraphQLEnumType} from "graphql";
import {createSortTypeBase} from "./createSortTypeBase";

/**
 * Creates `sort` type suitable for use as input
 */
export function createInputSortType({baseName, sortFieldType, isMulti}: createInputSortType.Options) {
	const type = createSortTypeBase(`${baseName}_Query_Sort`, sortFieldType)
		.getInputTypeComposer({postfix: '_Input'});

	if (isMulti) {
		return type.NonNull.List;
	}
	return type;
}

export namespace createInputSortType {
	export interface Options {
		baseName: string,
		sortFieldType: GraphQLEnumType,
		/**
		 * Whether multiple sorting fields are allowed
		 */
		isMulti: boolean;
	}
}

