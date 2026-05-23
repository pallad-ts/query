import { QueryDescriptor } from "../QueryDescriptor";

describe("QueryDescriptor", () => {
	describe("createResult", () => {
		it("returns list result without pagination or sorting", () => {
			const descriptor = new QueryDescriptor();
			const list = [{ id: "1" }, { id: "2" }];

			expect(descriptor.createResult({ filter: {} }, list)).toEqual({
				list,
			});
		});

		it("adds single sorting metadata without pagination", () => {
			const descriptor = new QueryDescriptor().sortingBySingleField({
				fields: ["name", "age"],
				default: { field: "name", direction: "ASC" },
			});
			const query = {
				filter: {},
				sortBy: { field: "age" as const, direction: "DESC" as const },
			};

			expect(descriptor.createResult(query, [{ id: "1", age: 35 }])).toEqual({
				list: [{ id: "1", age: 35 }],
				sortBy: { field: "age", direction: "DESC" },
			});
		});

		it("combines offset pagination and multi sorting metadata", () => {
			const descriptor = new QueryDescriptor()
				.paginationByOffset()
				.sortingByMultipleFields({
					sortableFields: ["name", "age"],
					defaultSorting: [{ field: "name", direction: "ASC" }],
				});
			const query = {
				filter: {},
				offset: 10,
				limit: 2,
				sortBy: [
					{ field: "name" as const, direction: "ASC" as const },
					{ field: "age" as const, direction: "DESC" as const },
				],
			};

			expect(
				descriptor.createResult(query, [{ id: "1", name: "Ann", age: 35 }], {
					hasNextPage: true,
					hasPreviousPage: false,
				})
			).toEqual({
				list: [{ id: "1", name: "Ann", age: 35 }],
				pageInfo: {
					limit: 2,
					offset: 10,
					hasNextPage: true,
					hasPreviousPage: false,
				},
				sortBy: [
					{ field: "name", direction: "ASC" },
					{ field: "age", direction: "DESC" },
				],
			});
		});

		it("combines cursor pagination and single sorting metadata", () => {
			const descriptor = new QueryDescriptor()
				.paginationByCursor()
				.sortingBySingleField({
					fields: ["name", "age"],
					default: { field: "name", direction: "ASC" },
				});
			const query = {
				filter: {},
				limit: 2,
				sortBy: { field: "name" as const, direction: "ASC" as const },
			};
			const list = [
				{ id: "a", name: "Ann" },
				{ id: "b", name: "Bob" },
			];

			expect(
				descriptor.createResult(query, list, {
					hasNextPage: false,
					hasPreviousPage: true,
				})
			).toEqual({
				edges: [
					{ node: { id: "a", name: "Ann" }, cursor: { i: "a", k: "Ann" } },
					{ node: { id: "b", name: "Bob" }, cursor: { i: "b", k: "Bob" } },
				],
				nodes: list,
				pageInfo: {
					hasNextPage: false,
					hasPreviousPage: true,
					limit: 2,
					startCursor: { i: "a", k: "Ann" },
					endCursor: { i: "b", k: "Bob" },
				},
				sortBy: { field: "name", direction: "ASC" },
			});
		});
	});
});
