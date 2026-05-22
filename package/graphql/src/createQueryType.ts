import { GraphQLInputFieldConfigMap, GraphQLInputObjectType, GraphQLInputType } from "graphql";

export function createQueryType({
	baseName,
	filtersType,
	paginationFields,
	sortType,
}: createQueryType.Options) {
	return new GraphQLInputObjectType({
		name: `${baseName}_Query`,
		fields: {
			...(filtersType
				? {
						filters: { type: filtersType },
					}
				: undefined),
			...(sortType
				? {
						sortBy: {
							type: sortType,
						},
					}
				: undefined),
			...paginationFields,
		},
	});
}

export namespace createQueryType {
	export interface Options {
		baseName: string;
		filtersType?: GraphQLInputObjectType;
		paginationFields?: GraphQLInputFieldConfigMap;
		sortType?: GraphQLInputType;
	}
}
