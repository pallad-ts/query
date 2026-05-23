import {
	GraphQLFieldConfig,
	GraphQLFieldResolver,
	GraphQLInputFieldConfigMap,
	GraphQLInputObjectType,
	GraphQLList,
	GraphQLNonNull,
	GraphQLObjectType,
	GraphQLResolveInfo,
	GraphQLEnumType,
	GraphQLFieldConfigMap,
} from "graphql";
import { GraphQLCursor } from "@pallad/cursor-encoder-graphql";
import {
	PaginationDescriptorByCursor,
	PaginationDescriptorByOffset,
	PaginationDescriptor,
	QueryDescriptor,
	SortingDescriptorMulti,
} from "@pallad/query-descriptor";

import { createInputSortType } from "./createInputSortType";
import { createQueryType } from "./createQueryType";
import { createResultSortType } from "./createResultSortType";
import { createSortFieldType } from "./createSortFieldType";
import { GraphQLPageInfoPaginationByCursor } from "./GraphQLPageInfoPaginationByCursor";
import { GraphQLPageInfoPaginationByOffset } from "./GraphQLPageInfoPaginationByOffset";
import { getQueryFieldsForPaginationByCursor } from "./getQueryFieldsForPaginationByCursor";
import { getQueryFieldsForPaginationByOffset } from "./getQueryFieldsForPaginationByOffset";

export class GraphQLQueryBuilder<
	TSource = unknown,
	TContext = unknown,
	TEntity = unknown,
	TDescriptor extends QueryDescriptor<any, any, any, any> = QueryDescriptor<any, any, any, any>,
> {
	#inputType?: GraphQLInputObjectType;
	#resultType?: GraphQLObjectType;
	#sortFieldType?: GraphQLEnumType;

	constructor(
		readonly options: GraphQLQueryBuilder.Options<TSource, TContext, TEntity, TDescriptor>
	) {
		void options.descriptor.querySchema;
	}

	getInputType(): GraphQLInputObjectType {
		this.#inputType ??= createQueryType({
			baseName: this.options.baseName,
			filterType: this.options.filterType,
			fields: this.#getPaginationInputFields(),
			sortType: this.#getInputSortType(),
		});

		return this.#inputType;
	}

	getResolver(
		options: GraphQLQueryBuilder.ResolverOptions<
			TSource,
			TContext,
			ReturnType<TDescriptor["createQuery"]>,
			GraphQLQueryBuilder.ExecuteResult<TEntity, TDescriptor>
		>
	): GraphQLFieldResolver<TSource, TContext> {
		return async (source, args: GraphQLQueryBuilder.Args, context, info) => {
			const query = this.options.descriptor.createQuery(args.query ?? {});
			const result = await options.execute(query, source, context, info);

			return this.options.descriptor.createResult(
				query,
				result.list,
				result.pagination as never
			);
		};
	}

	getField(
		options: GraphQLQueryBuilder.FieldOptions<
			TSource,
			TContext,
			ReturnType<TDescriptor["createQuery"]>,
			GraphQLQueryBuilder.ExecuteResult<TEntity, TDescriptor>
		>
	): GraphQLFieldConfig<TSource, TContext> {
		return {
			type: this.getResultType(),
			args: {
				query: {
					type: this.getInputType(),
				},
			},
			resolve: this.getResolver(options),
		};
	}

	getResultType(): GraphQLObjectType {
		this.#resultType ??= new GraphQLObjectType({
			name: `${this.options.baseName}_Result`,
			fields: () => this.#getResultFields(),
		});

		return this.#resultType;
	}

	#getPaginationInputFields(): GraphQLInputFieldConfigMap | undefined {
		if (this.options.descriptor.paginationDescriptor instanceof PaginationDescriptorByCursor) {
			return getQueryFieldsForPaginationByCursor();
		}

		if (this.options.descriptor.paginationDescriptor instanceof PaginationDescriptorByOffset) {
			return getQueryFieldsForPaginationByOffset();
		}

		return undefined;
	}

	#getInputSortType() {
		const sortingDescriptor = this.options.descriptor.sortingDescriptor;
		if (!sortingDescriptor) {
			return undefined;
		}

		return createInputSortType({
			baseName: this.options.baseName,
			sortFieldType: this.#getSortFieldType(),
			isMulti: sortingDescriptor instanceof SortingDescriptorMulti,
		});
	}

	#getResultSortType() {
		const sortingDescriptor = this.options.descriptor.sortingDescriptor;
		if (!sortingDescriptor) {
			return undefined;
		}

		return createResultSortType({
			baseName: this.options.baseName,
			sortFieldType: this.#getSortFieldType(),
			isMulti: sortingDescriptor instanceof SortingDescriptorMulti,
		});
	}

	#getSortFieldType() {
		const sortingDescriptor = this.options.descriptor.sortingDescriptor;
		if (!sortingDescriptor) {
			throw new Error("Sorting descriptor is required to create sort field type.");
		}

		this.#sortFieldType ??= createSortFieldType(
			this.options.baseName,
			sortingDescriptor.fields
		);
		return this.#sortFieldType;
	}

	#getResultFields(): GraphQLFieldConfigMap<unknown, unknown> {
		return {
			...this.#getResultEntityFields(),
			...this.#getResultSortFields(),
		};
	}

	#getResultEntityFields(): GraphQLFieldConfigMap<unknown, unknown> {
		if (this.options.descriptor.paginationDescriptor instanceof PaginationDescriptorByCursor) {
			const edgeType = new GraphQLObjectType({
				name: `${this.options.baseName}_Edge`,
				fields: {
					node: {
						type: new GraphQLNonNull(this.options.entityType),
					},
					cursor: {
						type: new GraphQLNonNull(GraphQLCursor),
					},
				},
			});

			return {
				edges: {
					type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(edgeType))),
				},
				nodes: {
					type: new GraphQLNonNull(
						new GraphQLList(new GraphQLNonNull(this.options.entityType))
					),
				},
				pageInfo: {
					type: new GraphQLNonNull(GraphQLPageInfoPaginationByCursor),
				},
			};
		}

		const listFields = {
			list: {
				type: new GraphQLNonNull(
					new GraphQLList(new GraphQLNonNull(this.options.entityType))
				),
			},
		};

		if (this.options.descriptor.paginationDescriptor instanceof PaginationDescriptorByOffset) {
			return {
				...listFields,
				pageInfo: {
					type: new GraphQLNonNull(GraphQLPageInfoPaginationByOffset),
				},
			};
		}

		return listFields;
	}

	#getResultSortFields(): GraphQLFieldConfigMap<unknown, unknown> | undefined {
		const sortType = this.#getResultSortType();
		if (!sortType) {
			return undefined;
		}

		return {
			sortBy: {
				type: sortType,
			},
		};
	}
}

export namespace GraphQLQueryBuilder {
	export interface Options<
		TSource,
		TContext,
		TEntity,
		TDescriptor extends QueryDescriptor<any, any, any, any>,
	> {
		baseName: string;
		descriptor: TDescriptor;
		filterType?: GraphQLInputObjectType;
		entityType: GraphQLObjectType<TEntity, TContext>;
	}

	export interface ResolverOptions<
		TSource,
		TContext,
		TQuery,
		TResult extends ExecuteResultBase<any>,
	> {
		execute: Execute<TSource, TContext, TQuery, TResult>;
	}

	export type FieldOptions<
		TSource,
		TContext,
		TQuery,
		TResult extends ExecuteResultBase<any>,
	> = ResolverOptions<TSource, TContext, TQuery, TResult>;

	export interface ExecuteResultBase<TEntity> {
		list: TEntity[];
	}

	export type ExecuteResult<
		TEntity,
		TDescriptor extends QueryDescriptor<any, any, any, any>,
	> = ExecuteResultBase<TEntity> &
		ExecutePaginationResult<QueryDescriptor.PaginationDescriptorType<TDescriptor>>;

	export type ExecutePaginationResult<TPaginationDescriptor> = [TPaginationDescriptor] extends [
		never,
	]
		? { pagination?: never }
		: { pagination: PaginationContext<TPaginationDescriptor> };

	export type PaginationContext<TPaginationDescriptor> =
		TPaginationDescriptor extends PaginationDescriptor<any, any>
			? Parameters<TPaginationDescriptor["createInitialResult"]>[2]
			: never;

	export type Execute<TSource, TContext, TQuery, TResult extends ExecuteResultBase<any>> = (
		query: TQuery,
		source: TSource,
		context: TContext,
		info: GraphQLResolveInfo
	) => Promise<TResult> | TResult;

	export interface Args {
		query?: unknown;
	}
}
