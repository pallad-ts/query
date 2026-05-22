import { Builder as _Builder } from "@pallad/builder";
import {
	InputTypeComposer,
	ObjectTypeComposer,
	Resolver,
	ResolverResolveParams,
	SchemaComposer,
} from "graphql-compose";
import { GraphQLEnumType, GraphQLInputObjectType, GraphQLObjectType } from "graphql";
import {
	ObjectTypeComposerFieldConfigAsObjectDefinition,
	ObjectTypeComposerFieldConfigMapDefinition,
} from "graphql-compose/lib/ObjectTypeComposer";
import * as is from "predicates";
import { NonNullComposer } from "graphql-compose/lib/NonNullComposer";
import {
	createInputSortType,
	createQueryType,
	createResultSortType,
	createSortFieldType,
	getQueryFieldsForPaginationByCursor,
	getQueryFieldsForPaginationByOffset,
} from "@pallad/query-graphql-base";
import { PaginationDescriptorByCursor, QueryDescriptor } from "@pallad/query-descriptor";

const assertEntityTypeIsObjectTypeComposer = is.assert(
	is.instanceOf(ObjectTypeComposer),
	"Entity type must be a type of ObjectTypeComposer"
);

export class GraphQLQueryBuilder<
	TQueryDescriptor extends QueryDescriptor<any, any>,
	TContext,
> extends _Builder {
	constructor(private queryDescriptor: TQueryDescriptor) {
		super();
	}

	getResultType() {
		if (this.queryDescriptor.paginationDescriptor instanceof PaginationDescriptorByCursor) {

		}
	}
	getBaseName() {
		if (this.options.name) {
			return this.options.name;
		}

		return this.options.entityType instanceof GraphQLObjectType
			? this.options.entityType.name
			: this.options.entityType.getTypeName();
	}

	useExtraMetaFields(
		extraMetaFields: ObjectTypeComposerFieldConfigMapDefinition<TEntityType, TContext>
	): this {
		this.extraMetaFields = extraMetaFields;
		return this;
	}

	private getResultMetaType() {
		if (!this.resultMetaType) {
			this.resultMetaType = createResultMetaType({
				paginationFields: this.getResultMetaPaginationFields(),
				sortType: this.createOutputSortType(),
				baseName: this.getBaseName(),
				extraMetaFields: this.extraMetaFields,
			});
		}
		return this.resultMetaType;
	}

	private getResultMetaPaginationFields() {
		const pagination = this.queryDescriptor.paginationDescriptor();

		if (pagination?.type === "byCursor") {
			return getResultMetaFieldsForPaginationByCursor();
		}

		if (pagination?.type === "byOffset") {
			return getResultMetaFieldsForPaginationByOffset();
		}
	}

	getResultType(): NonNullComposer<ObjectTypeComposer<Result<TEntityType>, TContext>> {
		if (!this.resultType) {
			this.resultType = createResultType<TEntityType, TContext>({
				metaType: this.getResultMetaType(),
				entityType: this.options.entityType,
				baseName: this.getBaseName(),
			});
		}
		return this.resultType;
	}

	getQueryArgType() {
		if (!this.queryType) {
			this.queryType = createQueryType({
				baseName: this.getBaseName(),
				filtersType: this.getFiltersType(),
				paginationFields: this.getQueryPaginationFields(),
				sortType: this.createInputSortType(),
			});
		}
		return this.queryType;
	}

	private createInputSortType() {
		const sorting = this.queryDescriptor.sortingConfig;
		if (!sorting) {
			return;
		}
		return createInputSortType({
			baseName: this.getBaseName(),
			sortFieldType: this.getSortFieldType(),
			isMulti: sorting.type === "multi",
		});
	}

	private getQueryPaginationFields() {
		const pagination = this.queryDescriptor.paginationConfig;

		if (pagination?.type === "byCursor") {
			return getQueryFieldsForPaginationByCursor();
		}

		if (pagination?.type === "byOffset") {
			return getQueryFieldsForPaginationByOffset();
		}
	}

	private createOutputSortType() {
		const sorting = this.queryDescriptor.sortingConfig;
		if (!sorting) {
			return;
		}
		return createResultSortType({
			baseName: this.getBaseName(),
			sortFieldType: this.getSortFieldType(),
			isMulti: sorting.type === "multi",
		});
	}

	private getSortFieldType() {
		if (!this.sortFieldType) {
			this.sortFieldType = createSortFieldType(
				this.getBaseName(),
				this.queryDescriptor.sortingConfig!.sortableFields
			);
		}
		return this.sortFieldType;
	}

	private getFiltersType() {
		return this.options.filtersType instanceof InputTypeComposer
			? this.options.filtersType.getType()
			: this.options.filtersType;
	}

	getQueryField(): ObjectTypeComposerFieldConfigAsObjectDefinition<
		unknown,
		TContext,
		{ query: QueryDescriptor.QueryType<TQueryDescriptor> }
	> {
		return {
			type: this.getResultType(),
			args: {
				query: {
					type: this.getQueryArgType(),
				},
			},
			resolve: async (source, args, context) => {
				const query = await this.queryDescriptor.createQueryOrFail(
					args.query,
					"Invalid query"
				);
				return this.options.fetcher(query, context);
			},
		};
	}

	getResolver(schemaComposer: SchemaComposer, name: string = "query") {
		const queryField = this.getQueryField();
		return new Resolver(
			{
				name,
				args: queryField.args,
				type: queryField.type,
				resolve: (rp: ResolverResolveParams<any, any>) => {
					return queryField.resolve!(rp.source, rp.args, rp.context, rp.info);
				},
			},
			schemaComposer
		);
	}

	attachQueryResolverToEntity(name: string = "query") {
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
		entityType:
			| ObjectTypeComposer<TEntityType, TContext>
			| GraphQLObjectType<TEntityType, TContext>;
		filtersType: GraphQLInputObjectType | InputTypeComposer<TContext>;
	}
}
