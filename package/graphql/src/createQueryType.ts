import { GraphQLInputFieldConfigMap, GraphQLInputObjectType, GraphQLInputType } from "graphql";

export function createQueryType({
	baseName,
	filterType,
	fields,
	sortType,
}: createQueryType.Options) {
	return new GraphQLInputObjectType({
		name: `${baseName}_Query`,
		fields: {
			...(filterType
				? {
						filter: { type: filterType },
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
		filterType?: GraphQLInputObjectType;
		fields?: GraphQLInputFieldConfigMap;
		sortType?: GraphQLInputType;
	}
}
