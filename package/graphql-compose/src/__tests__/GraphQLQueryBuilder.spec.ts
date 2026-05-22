import { ObjectTypeComposer, printSchemaComposer, SchemaComposer } from "graphql-compose";
import { GraphQLID, GraphQLInputObjectType, GraphQLSchema, GraphQLString } from "graphql";
import { GraphQLQueryBuilder } from "@src/GraphQLQueryBuilder";
import { QueryDescriptor } from "@pallad/query-descriptor";
import { DEFAULT_SORTING, SORTABLE_FIELDS } from "./fixtures";
import * as sinon from "sinon";
import { parse, execute } from "graphql";
import { fromZodValidation } from "@pallad/violations-zod";
import { z } from "zod";

function printSchemaForBuilder(queryBuilder: GraphQLQueryBuilder<any, any, any>) {
	const composer = new SchemaComposer();
	composer.Query.addFields({
		query: queryBuilder.getQueryField(),
	});

	return printSchemaComposer(buildSchemaForBuilder(queryBuilder), {
		sortTypes: true,
	});
}

function buildSchemaForBuilder(queryBuilder: GraphQLQueryBuilder<any, any, any>) {
	const composer = new SchemaComposer();
	composer.Query.addFields({
		query: queryBuilder.getQueryField(),
	});
	return composer;
}

function runQueryForBuilder(
	queryBuilder: GraphQLQueryBuilder<any, any, any>,
	query: string,
	variables: Record<string, any>,
	context: any
) {
	const composer = buildSchemaForBuilder(queryBuilder);
	return runQuery(composer.buildSchema(), query, variables, context);
}

function runQuery(
	schema: GraphQLSchema,
	query: string,
	variables: Record<string, any>,
	context: any
) {
	return execute({
		contextValue: context,
		schema,
		document: parse(query),
		variableValues: variables,
	});
}

describe("GraphQLQueryBuilder", () => {
	const entityType = ObjectTypeComposer.createTemp({
		name: "Entity",
		fields: {
			id: { type: GraphQLID },
			name: { type: GraphQLString },
		},
	});

	const filtersType = new GraphQLInputObjectType({
		name: "Filters",
		fields: {
			test: { type: GraphQLString },
		},
	});

	const CONTEXT = { some: "context" };

	describe("simple", () => {
		const builder = new GraphQLQueryBuilder(new QueryDescriptor(), {
			entityType,
			fetcher() {
				return {} as any;
			},
			filtersType,
		});

		it("schema", () => {
			expect(printSchemaForBuilder(builder)).toMatchSnapshot();
		});
	});

	describe("cursor pagination", () => {
		const builder = new GraphQLQueryBuilder(
			new QueryDescriptor()
				.cursorPagination({ defaultLimit: 100, maxLimit: 1000 })
				.singleSorting(SORTABLE_FIELDS.slice(), DEFAULT_SORTING),
			{
				entityType,
				fetcher() {
					return {} as any;
				},
				filtersType,
			}
		);

		it("schema", () => {
			expect(printSchemaForBuilder(builder)).toMatchSnapshot();
		});

		describe("resolving query", () => {
			const QUERY = `
				query ($query: Entity_Query!) {
					query (query: $query) {
						results {
							id
							name
						}
					}
				}
			`;
			it("success for simple", async () => {
				const stub = sinon.stub().resolves({
					results: [],
				});

				const builder = new GraphQLQueryBuilder(new QueryDescriptor(), {
					entityType,
					fetcher: stub,
					filtersType,
				});

				const result = await runQueryForBuilder(
					builder,
					QUERY,
					{ query: { filters: {} } },
					CONTEXT
				);

				expect(result.errors).toBeUndefined();

				sinon.assert.calledWithExactly(
					stub,
					{
						filters: {},
					},
					CONTEXT
				);
			});

			it("fails if violates filters schema", async () => {
				const stub = sinon.stub().resolves({
					results: [],
				});
				const builder = new GraphQLQueryBuilder(
					new QueryDescriptor().filtersValidator(input => {
						return fromZodValidation(
							z.object({
								test: z.enum(["foo", "bar"]),
							}),
							input
						);
					}),
					{
						entityType,
						fetcher: stub,
						filtersType,
					}
				);

				const result = await runQueryForBuilder(
					builder,
					QUERY,
					{
						query: {
							filters: {
								test: "zee",
							},
						},
					},
					CONTEXT
				);

				expect(result.errors).not.toBeUndefined();
				expect(result.errors).toMatchSnapshot();
			});
		});
	});

	describe("offset pagination", () => {
		const builder = new GraphQLQueryBuilder(
			new QueryDescriptor().offsetPagination({ defaultLimit: 100, maxLimit: 1000 }),
			{
				entityType,
				fetcher() {
					return {} as any;
				},
				filtersType,
			}
		);

		it("schema", () => {
			expect(printSchemaForBuilder(builder)).toMatchSnapshot();
		});
	});

	describe("multi sorting", () => {
		const builder = new GraphQLQueryBuilder(
			new QueryDescriptor().multiSorting(SORTABLE_FIELDS.slice(), [DEFAULT_SORTING]),
			{
				entityType,
				fetcher() {
					return {} as any;
				},
				filtersType,
			}
		);

		it("schema", () => {
			expect(printSchemaForBuilder(builder)).toMatchSnapshot();
		});
	});

	describe("single sorting", () => {
		const builder = new GraphQLQueryBuilder(
			new QueryDescriptor().singleSorting(SORTABLE_FIELDS.slice(), DEFAULT_SORTING),
			{
				entityType,
				fetcher() {
					return {} as any;
				},
				filtersType,
			}
		);

		it("schema", () => {
			expect(printSchemaForBuilder(builder)).toMatchSnapshot();
		});
	});

	it("as resolver", async () => {
		const entityType = ObjectTypeComposer.createTemp({
			name: "Entity",
			fields: {
				id: { type: GraphQLID },
				name: { type: GraphQLString },
			},
		});

		const builder = new GraphQLQueryBuilder(
			new QueryDescriptor()
				.cursorPagination({ defaultLimit: 100, maxLimit: 1000 })
				.singleSorting(SORTABLE_FIELDS.slice(), DEFAULT_SORTING),
			{
				entityType,
				fetcher() {
					return {
						results: [{ id: "1", name: "foo" }],
					};
				},
				filtersType,
			}
		);

		builder.attachQueryResolverToEntity();

		const composer = new SchemaComposer();
		composer.Query.addFields({
			query: entityType.getResolver("query"),
		});

		const result = await runQuery(
			composer.buildSchema(),
			`
				query ($query: Entity_Query!) {
					query (query: $query) {
						results {
							id
							name
						}
					}
				}
			`,
			{ query: { filters: {} } },
			CONTEXT
		);

		expect(result.errors).toBeUndefined();
		expect(result.data).toEqual({
			query: {
				results: [{ id: "1", name: "foo" }],
			},
		});
	});
});
