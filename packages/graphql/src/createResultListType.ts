import {GraphQLList, GraphQLNonNull, GraphQLObjectType} from "graphql";
import {ObjectTypeComposer} from "graphql-compose";

export function createResultListType(entityType: GraphQLObjectType | ObjectTypeComposer) {
	if (entityType instanceof GraphQLObjectType) {
		return new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(entityType)));
	}
	return entityType.NonNull.getTypePlural().NonNull;
}
