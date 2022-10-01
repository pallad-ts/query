import {ObjectTypeComposer} from "graphql-compose";
import {GraphQLNonNull, GraphQLEnumType} from "graphql";
import {GraphQLSortDirection} from "./types";

export function createSortTypeBase(name: string, sortFieldType: GraphQLEnumType) {
	return ObjectTypeComposer.createTemp({
		name: name,
		fields: {
			direction: {type: new GraphQLNonNull(GraphQLSortDirection)},
			field: {
				type: new GraphQLNonNull(
					sortFieldType
				)
			}
		}
	})
}
