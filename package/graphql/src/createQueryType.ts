import { GraphQLInputFieldConfigMap, GraphQLInputObjectType, GraphQLInputType } from "graphql";

export function createQueryType({
	baseName,
	filtersType,
	fields,
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
			...fields,
		},
	});
}

export namespace createQueryType {
	export interface Options {
		baseName: string;
		filtersType?: GraphQLInputObjectType;
		fields?: GraphQLInputFieldConfigMap;
		sortType?: GraphQLInputType;
	}
}
