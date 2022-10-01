import {GraphQLEnumType} from "graphql";
import {createSortTypeBase} from "./createSortTypeBase";

export function createResultSortType({baseName, sortFieldType, isMulti}: createResultSortType.Options) {
	const type = createSortTypeBase(`${baseName}_Result_Sort`, sortFieldType);
	if (isMulti) {
		return type.NonNull.List.NonNull;
	}
	return type.NonNull;
}

export namespace createResultSortType {
	export interface Options {
		baseName: string,
		sortFieldType: GraphQLEnumType,
		/**
		 * Whether multiple sorting fields are allowed
		 */
		isMulti: boolean;
	}
}
