import {Builder as _Builder} from '@pallad/builder';
import {InputTypeComposer, ListComposer, ObjectTypeComposer, Resolver, ResolverResolveParams, SchemaComposer} from "graphql-compose";
import {GraphQLEnumType, GraphQLInputObjectType, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString} from "graphql";
import {Result} from "@pallad/query";
import {
	ObjectTypeComposerFieldConfigAsObjectDefinition,
	ObjectTypeComposerFieldConfigMapDefinition
} from "graphql-compose/lib/ObjectTypeComposer";
import {ThunkWithSchemaComposer} from "graphql-compose/lib/utils/definitions";
import {InputTypeComposerFieldConfigMapDefinition} from "graphql-compose/lib/InputTypeComposer";
import * as is from 'predicates'
import {QueryBuilder} from "@pallad/query-builder";
import {GraphQLPositiveInt} from "graphql-scalars";
import {NonNullComposer} from "graphql-compose/lib/NonNullComposer";
import {createResultListType} from "./createResultListType";
import {createSortFieldType} from "./createSortFieldType";
import {createInputSortType} from "./createInputSortType";
import {createResultSortType} from "./createResultSortType";

const assertEntityTypeIsObjectTypeComposer = is.assert(is.instanceOf(ObjectTypeComposer), 'Entity type must be a type of ObjectTypeComposer');

export class GraphQLQueryBuilder<TEntityType, TQueryBuilder extends QueryBuilder<any>, TContext> extends _Builder {
	private extraMetaFields?: ObjectTypeComposerFieldConfigMapDefinition<TEntityType, TContext>;

	private sortFieldType?: GraphQLEnumType;
	private queryType?: InputTypeComposer;
	private resultMetaType?: NonNullComposer<ObjectTypeComposer>;
	private resultType?: NonNullComposer<ObjectTypeComposer>;

	constructor(
		private queryBuilder: TQueryBuilder,
		private options: GraphQLQueryBuilder.Options<TQueryBuilder['config']['query'], TEntityType, TContext>) {
		super();
	}

	getName() {
		if (this.options.name) {
			return this.options.name;
		}

		return this.options.entityType instanceof GraphQLObjectType ? this.options.entityType.name : this.options.entityType.getTypeName();
	}

	useExtraMetaFields(extraMetaFields: ObjectTypeComposerFieldConfigMapDefinition<TEntityType, TContext>): this {
		this.extraMetaFields = extraMetaFields;
		return this;
	}

	private getResultMetaType() {
		if (!this.resultMetaType) {
			const metaFields: ObjectTypeComposerFieldConfigMapDefinition<any, TContext> = {};
			const metaPaginationFields = this.getMetaPaginationFields();
			if (metaPaginationFields) {
				Object.assign(metaFields, metaPaginationFields);
			}

			const metaSortingFields = this.getMetaSortingFields();

			if (metaSortingFields) {
				Object.assign(metaFields, metaSortingFields);
			}

			if (this.extraMetaFields) {
				Object.assign(metaFields, this.extraMetaFields);
			}

			if (!Object.keys(metaFields).length) {
				return;
			}

			this.resultMetaType = ObjectTypeComposer.createTemp<any, TContext>({
				name: `${this.getName()}_Result_Meta`,
				fields: metaFields
			}).NonNull;
		}
		return this.resultMetaType;
	}

	private getMetaPaginationFields() {
		const pagination = this.queryBuilder.config.getPagination();

		if (!pagination) {
			return;
		}

		if (pagination.type === 'byCursor') {
			return {
				nextPage: {type: GraphQLString},
				previousPage: {type: GraphQLString},
				limit: {type: new GraphQLNonNull(GraphQLPositiveInt)}
			};
		}

		if (pagination.type === 'byOffset') {
			return {
				limit: {type: new GraphQLNonNull(GraphQLPositiveInt)},
				offset: {type: new GraphQLNonNull(GraphQLPositiveInt)}
			}
		}
	}

	private getMetaSortingFields() {
		const sorting = this.queryBuilder.config.getSorting();
		if (!sorting) {
			return;
		}
		return {
			sortBy: {type: this.createOutputSortType()}
		};
	}

	getResultType(): NonNullComposer<ObjectTypeComposer<Result<TEntityType>, TContext>> {
		if (!this.resultType) {
			const metaType = this.getResultMetaType();
			this.resultType = ObjectTypeComposer.createTemp<Result<TEntityType>, TContext>({
				name: `${this.getName()}_Result`,
				fields: {
					results: {type: createResultListType(this.options.entityType)},
					...(metaType ? {meta: {type: metaType}} : {})
				}
			}).NonNull;
		}
		return this.resultType;
	}

	getQueryArgType() {
		if (!this.queryType) {
			const fields: ThunkWithSchemaComposer<InputTypeComposerFieldConfigMapDefinition, any> = {
				filters: {type: this.getFiltersType()}
			};

			const sortByType = this.createInputSortType();
			if (sortByType) {
				fields.sortBy = {
					type: sortByType
				};
			}

			const pagination = this.queryBuilder.config.getPagination();
			if (pagination) {
				fields.limit = {type: GraphQLPositiveInt};
				if (pagination.type === 'byOffset') {
					fields.offset = {type: GraphQLPositiveInt};
				} else if (pagination.type === 'byCursor') {
					fields.after = {type: GraphQLString};
					fields.before = {type: GraphQLString};
				}
			}

			this.queryType = InputTypeComposer.createTemp<TContext>({
				name: this.getName() + '_Query',
				fields
			});
		}
		return this.queryType;
	}

	private createInputSortType() {
		const sorting = this.queryBuilder.config.getSorting();
		if (!sorting) {
			return;
		}
		return createInputSortType({
			baseName: this.getName(),
			sortFieldType: this.getSortFieldType(),
			isMulti: sorting.type === 'multi'
		});
	}

	private createOutputSortType() {
		const sorting = this.queryBuilder.config.getSorting();
		if (!sorting) {
			return;
		}
		return createResultSortType({
			baseName: this.getName(),
			sortFieldType: this.getSortFieldType(),
			isMulti: sorting.type === 'multi'
		});
	}

	private getSortFieldType() {
		if (!this.sortFieldType) {
			this.sortFieldType = createSortFieldType(this.getName(), this.queryBuilder.config.getSorting()!.sortableFields)
		}
		return this.sortFieldType;
	}

	private getFiltersType() {
		return this.options.filtersType;
	}

	getQueryField(): ObjectTypeComposerFieldConfigAsObjectDefinition<unknown, TContext, { query: TQueryBuilder['config']['query'] }> {
		return {
			type: this.getResultType(),
			args: {
				query: {
					type: this.getQueryArgType()
				}
			},
			resolve: async (source, args, context) => {
				const query = await this.queryBuilder.buildOrFail(args.query, 'Invalid query');
				return this.options.fetcher(query, context);
			}
		}
	}

	getResolver(schemaComposer: SchemaComposer, name: string = 'query') {
		const queryField = this.getQueryField();
		return new Resolver({
			name,
			args: queryField.args,
			type: queryField.type,
			resolve: (rp: ResolverResolveParams<any, any>) => {
				return queryField.resolve!(rp.source, rp.args, rp.context, rp.info);
			}
		}, schemaComposer);
	}

	attachQueryResolverToEntity(name: string = 'query') {
		this.assertResolverConfig();
		const entityType = this.options.entityType as ObjectTypeComposer;
		const resolver = this.getResolver(entityType.schemaComposer, name);
		entityType.addResolver(resolver);
		return resolver;
	}

	private assertResolverConfig() {
		assertEntityTypeIsObjectTypeComposer(this.options.entityType);
	}
}

export namespace GraphQLQueryBuilder {
	export interface Options<TQuery, TEntityType, TContext> {
		name?: string;
		fetcher: (query: TQuery, context: TContext) => Promise<Result<TEntityType>> | Result<TEntityType>,
		entityType: ObjectTypeComposer<TEntityType, TContext> | GraphQLObjectType<TEntityType, TContext>
		filtersType: GraphQLInputObjectType | InputTypeComposer<TContext>;
	}
}
