import {Builder as _Builder} from '@pallad/builder';
import {InputTypeComposer, ObjectTypeComposer, ResolverResolveParams} from "graphql-compose";
import {GraphQLEnumType, GraphQLInputObjectType, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString} from "graphql";
import {Query, Result, SortableFieldDefinition} from "@pallad/query";
import {
	ObjectTypeComposerFieldConfigAsObjectDefinition,
	ObjectTypeComposerFieldConfigMapDefinition
} from "graphql-compose/lib/ObjectTypeComposer";
import {ThunkWithSchemaComposer} from "graphql-compose/lib/utils/definitions";
import {InputTypeComposerFieldConfigMapDefinition} from "graphql-compose/lib/InputTypeComposer";
import {GraphQLSortDirection} from "./types";
import * as is from 'predicates'

const assertEntityTypeIsObjectTypeComposer = is.assert(is.instanceOf(ObjectTypeComposer), 'Entity type must be a type of ObjectTypeComposer');

export class GraphQLQueryBuilder<TEntityType, TQuery extends Query<any>, TContext, TSortableField extends string> extends _Builder {
	private paginationType?: 'byCursor' | 'byOffset';
	private sortableType?: 'multi' | 'single';
	private extraMetaFields?: ObjectTypeComposerFieldConfigMapDefinition<TEntityType, TContext>;
	private sortableFields?: string[];
	private defaultSorting?: SortableFieldDefinition<TSortableField> | Array<SortableFieldDefinition<TSortableField>>;

	constructor(
		private fetcher: (query: TQuery, context: TContext) => Result<TEntityType>,
		private options: GraphQLQueryBuilder.Options<TEntityType, TContext>) {
		super();
	}

	getName() {
		if (this.options.name) {
			return this.options.name;
		}

		return this.options.entityType instanceof GraphQLObjectType ? this.options.entityType.name : this.options.entityType.getTypeName();
	}

	paginateByCursor(): this {
		this.paginationType = 'byCursor'
		return this;
	}

	paginateByOffset(): this {
		this.paginationType = 'byOffset';
		return this;
	}

	multiSortable(sortableFields: TSortableField[]): this {
		this.sortableType = 'multi';
		this.sortableFields = sortableFields;
		return this;
	}

	defaultSortOrder(order: SortableFieldDefinition<TSortableField> | Array<SortableFieldDefinition<TSortableField>>): this {
		this.defaultSorting = order;
		return this;
	}

	singleSortable(sortableFields: TSortableField[]): this {
		this.sortableType = 'single';
		this.sortableFields = sortableFields;
		return this;
	}

	useExtraMetaFields(extraMetaFields: ObjectTypeComposerFieldConfigMapDefinition<TEntityType, TContext>): this {
		this.extraMetaFields = extraMetaFields;
		return this;
	}

	private getResultMetaType() {
		const metaFields: ObjectTypeComposerFieldConfigMapDefinition<any, TContext> = {};
		const metaPaginationFields = this.getMetaPaginationFields();
		if (metaPaginationFields) {
			Object.assign(metaFields, metaPaginationFields);
		}

		if (this.extraMetaFields) {
			Object.assign(metaFields, this.extraMetaFields);
		}

		if (!Object.keys(metaFields).length) {
			return;
		}

		return ObjectTypeComposer.createTemp<any, TContext>({
			name: `${this.getName()}_Query_Result_Meta`,
			fields: metaFields
		});
	}

	private getMetaPaginationFields() {
		if (!this.paginationType) {
			return;
		}

		if (this.paginationType === 'byCursor') {
			return {
				nextPage: {type: GraphQLString},
				previousPage: {type: GraphQLString},
				limit: {type: new GraphQLNonNull(GraphQLInt)}
			};
		}

		if (this.paginationType === 'byOffset') {
			return {
				limit: {type: new GraphQLNonNull(GraphQLInt)},
				offset: {type: GraphQLInt}
			}
		}
	}

	getResultType(): ObjectTypeComposer<Result<TEntityType>, TContext> {
		const metaType = this.getResultMetaType();
		return ObjectTypeComposer.createTemp<Result<TEntityType>, TContext>({
			name: `${this.getName()}_Query_Result`,
			fields: {
				results: {type: this.getEntityTypePlural()},
				...(metaType ? {meta: {type: metaType}} : {})
			}
		});
	}

	private getEntityTypePlural() {
		const entityType = this.options.entityType;
		if (entityType instanceof GraphQLObjectType) {
			return new GraphQLList(new GraphQLNonNull(entityType));
		}
		return entityType.getTypePlural();
	}

	getQueryArgType() {
		const fields: ThunkWithSchemaComposer<InputTypeComposerFieldConfigMapDefinition, any> = {
			filters: {type: this.options.filtersType}
		};

		const sortByType = this.getSortByInputType();
		if (sortByType) {
			fields.sortBy = {
				type: sortByType
			};
		}

		if (this.paginationType) {
			fields.limit = {type: GraphQLInt};
			if (this.paginationType === 'byOffset') {
				fields.offset = {type: GraphQLInt};
			} else if (this.paginationType === 'byCursor') {
				fields.after = {type: GraphQLString};
				fields.before = {type: GraphQLString}
			}
		}

		return InputTypeComposer.createTemp<TContext>({
			name: this.getName() + '_Query',
			fields
		});
	}

	private getSortByInputType() {
		if (!this.sortableFields) {
			return;
		}
		const baseType = InputTypeComposer.createTemp({
			name: this.getName() + '_Query_Sort',
			fields: {
				direction: {type: GraphQLSortDirection},
				field: {
					type: new GraphQLEnumType({
						name: this.getName() + '_Query_Sort_Field',
						values: this.sortableFields!.reduce((result, field) => {
							result[field] = {value: field};
							return result;
						}, {} as Record<string, { value: string }>)
					})
				}
			}
		});

		if (this.sortableType === 'single') {
			return baseType;
		}
		return baseType.getTypePlural();
	}

	private getFiltersType() {
		const filtersType = this.options.filtersType;
		if (filtersType instanceof GraphQLInputObjectType) {
			return new GraphQLNonNull(filtersType);
		}

		return filtersType.getTypeNonNull();
	}

	getQueryField(): ObjectTypeComposerFieldConfigAsObjectDefinition<unknown, TContext, { query: TQuery }> {
		this.assertConfigurationSanity();
		return {
			type: this.getResultType(),
			args: {
				query: {
					type: this.getQueryArgType()
				}
			},
			resolve: (source, args, context) => {
				let query = args.query;
				if (!query) {
					query = {filters: {}} as TQuery;
				}
				if (!query.filters) {
					query.filters = {};
				}
				return this.fetcher(query, context);
			}
		}
	}

	private assertConfigurationSanity() {
		this.assertDefaultSortingType();
	}

	private assertDefaultSortingType() {
		if (Array.isArray(this.defaultSorting) && this.sortableType === 'single') {
			throw new Error('Cannot apply default sort order on multiple fields while query was configured for single sort order only');
		}
	}

	asResolver(name: string = 'query') {
		this.assertResolverConfig();

		const entityType = this.options.entityType as ObjectTypeComposer;
		const queryField = this.getQueryField();

		entityType.addResolver({
			name,
			args: queryField.args,
			type: queryField.type,

			resolve: (rp: ResolverResolveParams<any, any>) => {
				return queryField.resolve!(rp.source, rp.args, rp.context, rp.info);
			}
		});

		return entityType.getResolver(name);
	}

	private assertResolverConfig() {
		assertEntityTypeIsObjectTypeComposer(this.options.entityType);
	}
}

export namespace GraphQLQueryBuilder {
	export interface Options<TEntityType, TContext> {
		name?: string;
		entityType: ObjectTypeComposer<TEntityType, TContext> | GraphQLObjectType<TEntityType, TContext>
		filtersType: GraphQLInputObjectType | InputTypeComposer<TContext>;
	}
}
