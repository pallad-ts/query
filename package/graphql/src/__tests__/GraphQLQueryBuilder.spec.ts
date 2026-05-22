import { QueryDescriptor } from "@pallad/query-descriptor";
import {
	GraphQLInputObjectType,
	GraphQLInt,
	GraphQLNonNull,
	GraphQLObjectType,
	GraphQLSchema,
	GraphQLString,
	graphql,
	printSchema,
	printType,
} from "graphql";

import { GraphQLQueryBuilder } from "../GraphQLQueryBuilder";

describe("GraphQLQueryBuilder", () => {
	const filtersType = new GraphQLInputObjectType({
		name: "User_Filters",
		fields: {
			name: { type: GraphQLString },
		},
	});

	const entityType = new GraphQLObjectType({
		name: "User",
		fields: {
			id: { type: new GraphQLNonNull(GraphQLString) },
			name: { type: new GraphQLNonNull(GraphQLString) },
			age: { type: GraphQLInt },
		},
	});

	it("creates input type from descriptor", () => {
		const descriptor = new QueryDescriptor()
			.paginationByOffset()
			.sortingByMultipleFields({
				sortableFields: ["name", "age"],
				defaultSorting: [{ field: "name", direction: "ASC" }],
			});

		const builder = new GraphQLQueryBuilder({
			baseName: "Users",
			descriptor,
			filtersType,
			entityType,
			execute: () => ({ list: [] }),
		});

		expect(printType(builder.getInputType())).toMatchSnapshot();
	});

	it.each([
		[
			"list result",
			new QueryDescriptor(),
		],
		[
			"offset pagination and multi sorting result",
			new QueryDescriptor()
				.paginationByOffset()
				.sortingByMultipleFields({
					sortableFields: ["name", "age"],
					defaultSorting: [{ field: "name", direction: "ASC" }],
				}),
		],
		[
			"cursor pagination and single sorting result",
			new QueryDescriptor()
				.paginationByCursor()
				.sortingBySingleField({
					fields: ["name", "age"],
					default: { field: "name", direction: "ASC" },
				}),
		],
	])("creates %s type", (caseName, descriptor) => {
		void caseName;
		const builder = new GraphQLQueryBuilder({
			baseName: "Users",
			descriptor,
			entityType,
			execute: () => ({ list: [] }),
		});

		expect(printType(builder.getResultType())).toMatchSnapshot();
	});

	it("creates field definition", () => {
		const descriptor = new QueryDescriptor()
			.paginationByCursor()
			.sortingBySingleField({
				fields: ["name", "age"],
				default: { field: "name", direction: "ASC" },
			});

		const builder = new GraphQLQueryBuilder({
			baseName: "Users",
			descriptor,
			filtersType,
			entityType,
			execute: () => ({ list: [] }),
		});

		const schema = new GraphQLSchema({
			query: new GraphQLObjectType({
				name: "Query",
				fields: {
					users: builder.getField(),
				},
			}),
		});

		expect(printSchema(schema)).toMatchSnapshot();
	});

	it("creates resolver that parses query and wraps result", async () => {
		const descriptor = new QueryDescriptor()
			.paginationByOffset()
			.sortingByMultipleFields({
				sortableFields: ["name", "age"],
				defaultSorting: [{ field: "name", direction: "ASC" }],
			});
		const calls: unknown[] = [];
		const builder = new GraphQLQueryBuilder({
			baseName: "Users",
			descriptor,
			entityType,
			execute: (query, source, context, info) => {
				calls.push([query, source, context, info.fieldName]);
				return {
					list: [{ id: "1", name: "Ann", age: 35 }],
					pagination: {
						hasNextPage: true,
						hasPreviousPage: false,
					},
				};
			},
		});

		const schema = new GraphQLSchema({
			query: new GraphQLObjectType({
				name: "Query",
				fields: {
					users: builder.getField(),
				},
			}),
		});

		const result = await graphql({
			schema,
			source: `
				query {
					users(query: {limit: 2, offset: 10, sortBy: [{field: age, direction: DESC}]}) {
						list { id name age }
						pageInfo { limit offset hasNextPage hasPreviousPage }
						sortBy { field direction }
					}
				}
			`,
			contextValue: { requestId: "request-1" },
			rootValue: { root: true },
		});

		expect(result).toEqual({
			data: {
				users: {
					list: [{ id: "1", name: "Ann", age: 35 }],
					pageInfo: {
						limit: 2,
						offset: 10,
						hasNextPage: true,
						hasPreviousPage: false,
					},
					sortBy: [{ field: "age", direction: "DESC" }],
				},
			},
		});
		expect(calls).toEqual([
			[
				{
					limit: 2,
					offset: 10,
					sortBy: [{ field: "age", direction: "DESC" }],
				},
				{ root: true },
				{ requestId: "request-1" },
				"users",
			],
		]);
	});
});
