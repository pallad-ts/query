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
			filters: { type: filtersType },
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
		filtersType: GraphQLInputObjectType;
		paginationFields?: GraphQLInputFieldConfigMap;
		sortType?: GraphQLInputType;
	}
}
