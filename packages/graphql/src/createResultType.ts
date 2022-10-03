import {ObjectTypeComposer} from "graphql-compose";
import {createResultListType} from "./createResultListType";
import {Result} from "@pallad/query";
import {GraphQLObjectType} from "graphql";
import {ComposeOutputType} from "graphql-compose/lib/utils/typeHelpers";

export function createResultType<TEntity, TContext>({baseName, entityType, metaType}: createResultType.Options<TEntity, TContext>) {
	return ObjectTypeComposer.createTemp<Result<TEntity>, TContext>({
		name: `${baseName}_Result`,
		fields: {
			results: createResultListType(entityType),
			...(metaType ? {meta: metaType} : {})
		}
	}).NonNull;
}


export namespace createResultType {
	export interface Options<TEntity, TContext> {
		baseName: string;
		entityType: GraphQLObjectType<TEntity, TContext> | ObjectTypeComposer<TEntity, TContext>,
		metaType?: ComposeOutputType<any>;
	}
}
