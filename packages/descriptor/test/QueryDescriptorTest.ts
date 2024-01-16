import { QueryDescriptor } from "@src/QueryDescriptor";
import { assert, IsExact } from "conditional-type-checks";
import {
	PaginableByCursor,
	PaginableByOffset,
	Query,
	Result,
	ResultMeta,
	SortableMulti,
	SortableSingle,
} from "@pallad/query";
import { DEFAULT_SORTING, SORTABLE_FIELDS } from "./fixtures";
import { Either, right } from "@sweet-monads/either";
import { ViolationsList } from "@pallad/violations";
import { fromZodValidation } from "@pallad/violations-zod";
import { z } from "zod";

describe("QueryDescriptor", () => {
	describe("pagination", () => {
		it("by default not set", () => {
			const descriptor = new QueryDescriptor();
			expect(descriptor.paginationConfig).toBeUndefined();
		});

		describe("by cursor", () => {
			it("types", () => {
				const descriptor = new QueryDescriptor().cursorPagination();
				type ExpectedQuery = Query<unknown> & PaginableByCursor;
				type ExpectedResultMeta = PaginableByCursor.ResultMeta;

				assert<IsExact<QueryDescriptor.QueryType<typeof descriptor>, ExpectedQuery>>(true);
				assert<
					IsExact<QueryDescriptor.ResultMetaType<typeof descriptor>, ExpectedResultMeta>
				>(true);
			});

			it("applies default config if not set explicitly", () => {
				const config = new QueryDescriptor().cursorPagination();

				expect(config.paginationConfig).toEqual({
					type: "byCursor",
					defaultLimit: 50,
					maxLimit: 1000,
				});
			});

			it("merges with default settings", () => {
				const config = new QueryDescriptor().cursorPagination({ defaultLimit: 10 });

				expect(config.paginationConfig).toEqual({
					type: "byCursor",
					defaultLimit: 10,
					maxLimit: 1000,
				});
			});
		});

		describe("by offset", () => {
			it("types", () => {
				const descriptor = new QueryDescriptor().offsetPagination();
				type ExpectedQuery = Query<unknown> & PaginableByOffset;
				type ExpectedResultMeta = PaginableByOffset.ResultMeta;

				assert<IsExact<QueryDescriptor.QueryType<typeof descriptor>, ExpectedQuery>>(true);
				assert<
					IsExact<QueryDescriptor.ResultMetaType<typeof descriptor>, ExpectedResultMeta>
				>(true);
			});

			it("applies default config if not set explicitly", () => {
				const descriptor = new QueryDescriptor().offsetPagination();

				expect(descriptor.paginationConfig).toEqual({
					type: "byOffset",
					defaultLimit: 50,
					maxLimit: 1000,
				});
			});

			it("merges with default settings", () => {
				const descriptor = new QueryDescriptor().offsetPagination({ defaultLimit: 10 });

				expect(descriptor.paginationConfig).toEqual({
					type: "byOffset",
					defaultLimit: 10,
					maxLimit: 1000,
				});
			});
		});
	});

	describe("sorting", () => {
		it("by default not set", () => {
			const config = new QueryDescriptor();
			expect(config.sortingConfig).toBeUndefined();
		});

		describe("single", () => {
			const descriptor = new QueryDescriptor().singleSorting(["foo", "bar"], {
				field: "foo",
				direction: "ASC",
			});

			it("types", () => {
				type ExpectedQuery = Query<unknown> & SortableSingle<"foo" | "bar">;
				type ExpectedResultMeta = SortableSingle.ResultMeta<"foo" | "bar">;

				assert<IsExact<QueryDescriptor.QueryType<typeof descriptor>, ExpectedQuery>>(true);
				assert<
					IsExact<QueryDescriptor.ResultMetaType<typeof descriptor>, ExpectedResultMeta>
				>(true);
			});

			it("getting config", () => {
				expect(descriptor.sortingConfig).toEqual({
					type: "single",
					sortableFields: ["foo", "bar"],
					defaultSorting: { field: "foo", direction: "ASC" },
				});
			});
		});

		describe("multi", () => {
			const descriptor = new QueryDescriptor().multiSorting(
				["foo", "bar"],
				[
					{ field: "foo", direction: "ASC" },
					{ field: "bar", direction: "DESC" },
				]
			);

			it("types", () => {
				type ExpectedQuery = Query<unknown> & SortableMulti<"foo" | "bar">;
				type ExpectedResultMeta = SortableMulti.ResultMeta<"foo" | "bar">;

				assert<IsExact<QueryDescriptor.QueryType<typeof descriptor>, ExpectedQuery>>(true);
				assert<
					IsExact<QueryDescriptor.ResultMetaType<typeof descriptor>, ExpectedResultMeta>
				>(true);
			});

			it("getting config", () => {
				expect(descriptor.sortingConfig).toEqual({
					type: "multi",
					sortableFields: ["foo", "bar"],
					defaultSorting: [
						{ field: "foo", direction: "ASC" },
						{ field: "bar", direction: "DESC" },
					],
				});
			});
		});
	});

	describe("creating query", () => {
		describe("filters", () => {
			it("types", () => {
				const descriptor = new QueryDescriptor().filtersValidator(() =>
					right({
						foo: "bar",
					} as const)
				);

				type Expected = Query<{ foo: "bar" }>;
				assert<IsExact<QueryDescriptor.QueryType<typeof descriptor>, Expected>>(true);
			});

			it("by default accepts all filters", () => {
				const descriptor = new QueryDescriptor();

				expect(descriptor.createQuery({ filters: { literally: "anything" } })).toEqual(
					right({
						filters: { literally: "anything" },
					})
				);
			});

			describe("uses filters schema if provided", () => {
				const builder = new QueryDescriptor().filtersValidator(input => {
					return fromZodValidation(
						z.object({
							foo: z.literal("foo"),
							bar: z.literal("bar").optional(),
						}),
						input
					);
				});

				it("success", () => {
					expect(
						builder.createQuery({
							filters: {
								foo: "foo",
								bar: "bar",
							},
						})
					).toEqual(
						right({
							filters: { foo: "foo", bar: "bar" },
						})
					);
				});

				it("failure", async () => {
					const result = await builder.createQuery({ filters: {} });

					expect(result.isLeft()).toBe(true);

					expect(result.value).toMatchSnapshot();
				});
			});
		});

		describe("pagination", () => {
			describe.each<[string, QueryDescriptor<any, any>]>([
				[
					"by cursor",
					new QueryDescriptor()
						.cursorPagination()
						.singleSorting(["foo", "bar"], { field: "foo", direction: "ASC" }),
				],
				["by offset", new QueryDescriptor().offsetPagination()],
			])("common (for %s)", (name, qb) => {
				it("limit cannot be lower than 1", async () => {
					const result = await qb.createQuery({ limit: 0 });
					expect(result.value).toMatchSnapshot();
				});

				it("uses default limit", async () => {
					const result = await qb.createQuery({});
					expect(result.value).toMatchObject({ limit: 50 });
				});

				it("limit cannot be greater than max limit", async () => {
					const result = await qb.createQuery({ limit: 5000 });
					expect(result.value).toMatchSnapshot();
				});

				it("limit must be integer", async () => {
					const result = await qb.createQuery({ limit: "asdfa" });
					expect(result.value).toMatchSnapshot();
				});
			});

			describe("by cursor", () => {
				const descriptor = new QueryDescriptor()
					.cursorPagination()
					.singleSorting(SORTABLE_FIELDS.slice(), DEFAULT_SORTING);

				it("types", () => {
					type Expected = Either<
						ViolationsList,
						Query<unknown> & PaginableByCursor & SortableSingle<"foo" | "bar">
					>;

					assert<IsExact<ReturnType<(typeof descriptor)["createQuery"]>, Expected>>(true);
				});

				describe.each([["after"], ["before"]])('allows "%s" cursor property', property => {
					it("fails if not a string", () => {
						const result = descriptor.createQuery({ [property]: [] });
						expect(result.value).toMatchSnapshot();
					});

					it("success", () => {
						const value = `${property} cursor`;
						expect(descriptor.createQuery({ [property]: value })).toEqual(
							right({
								filters: {},
								[property]: value,
								limit: 50,
								sortBy: DEFAULT_SORTING,
							})
						);
					});
				});
			});

			describe("by offset", () => {
				const descriptor = new QueryDescriptor().offsetPagination();

				it("types", () => {
					type Expected = Either<ViolationsList, Query<unknown> & PaginableByOffset>;
					assert<IsExact<ReturnType<(typeof descriptor)["createQuery"]>, Expected>>(true);
				});

				it("offset by default is 0", () => {
					expect(descriptor.createQuery({})).toEqual(
						right({
							filters: {},
							limit: 50,
							offset: 0,
						})
					);
				});

				it("offset cannot be lower than 0", () => {
					const result = descriptor.createQuery({ offset: -1 });
					expect(result.value).toMatchSnapshot();
				});

				it("offset must be an integer", () => {
					const result = descriptor.createQuery({ offset: "asdfasdf" });
					expect(result.value).toMatchSnapshot();
				});
			});
		});

		describe("sorting", () => {
			describe.each([
				[
					"single",
					new QueryDescriptor().singleSorting(SORTABLE_FIELDS.slice(), DEFAULT_SORTING),
				],
				[
					"multi",
					new QueryDescriptor().multiSorting(SORTABLE_FIELDS.slice(), [DEFAULT_SORTING]),
				],
			])("common (for %s)", (name, qb) => {
				const isMulti = name === "multi";

				function testCase(sorting: any) {
					return qb.createQuery({ sortBy: isMulti ? [sorting] : sorting });
				}

				it("forces to use only allowed sortable fields", async () => {
					const result = await testCase({ field: "unsupported", direction: "ASC" });

					expect(result.value).toMatchSnapshot();
				});

				it("sortable field is required", async () => {
					const result = await testCase({ direction: "ASC" });

					expect(result.value).toMatchSnapshot();
				});

				it("sorting direction is required", async () => {
					const result = await testCase({ field: "foo" });

					expect(result.value).toMatchSnapshot();
				});

				it("fails for invalid sorting direction", async () => {
					const result = await testCase({ field: "foo", direction: "bas" });

					expect(result.value).toMatchSnapshot();
				});

				it.each([["ASC"], ["DESC"]])("sorting direction must be ASC or DESC", direction => {
					let sorting = { field: "foo", direction };
					expect(testCase(sorting)).toEqual(
						right({
							filters: {},
							sortBy: isMulti ? [sorting] : sorting,
						})
					);
				});

				it("applies default sorting if not explicitly set", () => {
					expect(qb.createQuery({})).toEqual(
						right({
							filters: {},
							sortBy: isMulti ? [DEFAULT_SORTING] : DEFAULT_SORTING,
						})
					);
				});
			});

			describe("single", () => {
				const descriptor = new QueryDescriptor().singleSorting(
					SORTABLE_FIELDS.slice(),
					DEFAULT_SORTING
				);

				it("types", () => {
					type Expected = Either<
						ViolationsList,
						Query<unknown> & SortableSingle<"foo" | "bar">
					>;

					assert<IsExact<ReturnType<(typeof descriptor)["createQuery"]>, Expected>>(true);
				});
			});

			describe("multi", () => {
				const builder = new QueryDescriptor().multiSorting(SORTABLE_FIELDS.slice(), [
					DEFAULT_SORTING,
				]);

				it("types", () => {
					type Expected = Either<
						ViolationsList,
						Query<unknown> & SortableMulti<"foo" | "bar">
					>;
					assert<IsExact<ReturnType<(typeof builder)["createQuery"]>, Expected>>(true);
				});

				it("sorting array cannot be empty", () => {
					const result = builder.createQuery({
						sortBy: [],
					});
					expect(result.value).toMatchSnapshot();
				});
			});
		});
	});

	// describe("query builder", () => {
	// 	it("required config to be valid before returning query builder", () => {
	// 		expect(() => {
	// 			new QueryConfig().cursorPagination().getQueryBuilder();
	// 		}).toThrowErrorMatchingSnapshot();
	// 	});
	//
	// 	it("types", () => {
	// 		const builder = new QueryConfig()
	// 			.singleSorting(["foo", "bar"], { field: "bar", direction: "ASC" })
	// 			.filters<Filters>()
	// 			.getQueryBuilder();
	//
	// 		type Expected = QueryBuilder<QueryDescriptor<Filters, SortableSingle<"foo" | "bar">>>;
	// 		assert<IsExact<typeof builder, Expected>>(true);
	// 	});
	// });

	describe("building result", () => {
		describe("none of options selected", () => {
			const descriptor = new QueryDescriptor();
			it("types", () => {
				type Expected = Result<unknown>;
				type Input = ReturnType<(typeof descriptor)["createResult"]>;

				const o: Input = { results: [] };
				assert<IsExact<Input, Expected>>(true);
			});

			it("building result", () => {
				expect(
					descriptor.createResult({
						results: [1, 2],
						query: {
							filters: {},
						},
					})
				).toEqual({
					results: [1, 2],
				});
			});
		});

		describe("cursor pagination", () => {
			const descriptor = new QueryDescriptor()
				.cursorPagination()
				.singleSorting(SORTABLE_FIELDS.slice(), DEFAULT_SORTING);

			it("types", () => {
				type Expected = Result<unknown> &
					ResultMeta<
						PaginableByCursor.ResultMeta & SortableSingle.ResultMeta<"foo" | "bar">
					>;
				type Input = ReturnType<(typeof descriptor)["createResult"]>;

				assert<IsExact<Input, Expected>>(true);
			});

			it("building result", () => {
				expect(
					descriptor.createResult({
						results: [1, 2],
						query: {
							filters: {},
							limit: 10,
							sortBy: DEFAULT_SORTING,
							after: "after",
							before: "before",
						},
						nextPageCursor: "nextPage",
						previousPageCursor: "previousPage",
					})
				).toEqual({
					results: [1, 2],
					meta: {
						limit: 10,
						nextPage: "nextPage",
						previousPage: "previousPage",
						sortBy: DEFAULT_SORTING,
					},
				});
			});
		});

		describe("offset pagination", () => {
			const descriptor = new QueryDescriptor().offsetPagination();

			it("types", () => {
				type Expected = Result<unknown> & ResultMeta<PaginableByOffset.ResultMeta>;
				type Input = ReturnType<(typeof descriptor)["createResult"]>;

				assert<IsExact<Input, Expected>>(true);
			});

			it("building result", () => {
				expect(
					descriptor.createResult({
						results: [1, 2],
						query: {
							filters: {},
							limit: 10,
							offset: 10,
						},
					})
				).toEqual({
					results: [1, 2],
					meta: {
						limit: 10,
						offset: 10,
					},
				});
			});
		});

		describe("multi sorting", () => {
			const descriptor = new QueryDescriptor().multiSorting(SORTABLE_FIELDS.slice(), [
				DEFAULT_SORTING,
			]);

			it("types", () => {
				type Expected = Result<unknown> &
					ResultMeta<SortableMulti.ResultMeta<"foo" | "bar">>;
				type Input = ReturnType<(typeof descriptor)["createResult"]>;

				assert<IsExact<Input, Expected>>(true);
			});

			it("building result", () => {
				expect(
					descriptor.createResult({
						results: [1, 2],
						query: {
							filters: {},
							sortBy: [
								{ field: "foo", direction: "ASC" },
								{ field: "bar", direction: "DESC" },
							],
						},
					})
				).toEqual({
					results: [1, 2],
					meta: {
						sortBy: [
							{ field: "foo", direction: "ASC" },
							{ field: "bar", direction: "DESC" },
						],
					},
				});
			});
		});
	});

	describe("validation", () => {
		it("pagination by cursor cannot be used without single sorting setup", () => {
			expect(() => {
				new QueryDescriptor().cursorPagination().validate();
			}).toThrowErrorMatchingSnapshot();
		});

		it("pagination by cursor cannot be used with multi sorting", () => {
			expect(() => {
				new QueryDescriptor()
					.cursorPagination()
					.multiSorting(["foo", "bar"], [{ field: "foo", direction: "ASC" }])
					.validate();
			}).toThrowErrorMatchingSnapshot();
		});
	});
});
