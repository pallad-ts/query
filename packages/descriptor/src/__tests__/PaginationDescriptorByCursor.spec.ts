import { PaginationDescriptorByCursor } from "../PaginationDescriptorByCursor";

describe("PaginationDescriptorByCursor", () => {
	it("uses default config values and freezes instance", () => {
		const descriptor = new PaginationDescriptorByCursor();

		expect(descriptor.defaultLimit).toBe(20);
		expect(descriptor.maxLimit).toBe(1000);
		expect(Object.isFrozen(descriptor)).toBe(true);
	});

	it("parses valid input and applies default limit", () => {
		const descriptor = new PaginationDescriptorByCursor({
			defaultLimit: 15,
			maxLimit: 50,
		});

		expect(descriptor.schema.parse({ before: "YWJj", after: "ZGVm" })).toEqual({
			before: "YWJj",
			after: "ZGVm",
			limit: 15,
		});
	});

	it("rejects limit above configured maximum", () => {
		const descriptor = new PaginationDescriptorByCursor({
			defaultLimit: 10,
			maxLimit: 25,
		});

		expect(() => descriptor.schema.parse({ limit: 30 })).toThrowError();
	});

	it("creates cursor pagination result with sorting key", () => {
		const descriptor = new PaginationDescriptorByCursor();
		const query = {
			limit: 2,
			sortBy: {
				field: "name",
				direction: "ASC" as const,
			},
		};
		const list = [
			{ id: "1", name: "Ann" },
			{ id: "2", name: "Bob" },
		];

		expect(
			descriptor.createInitialResult(query, list, {
				hasNextPage: true,
				hasPreviousPage: false,
			})
		).toEqual({
			edges: [
				{ node: { id: "1", name: "Ann" }, cursor: { i: "1", k: "Ann" } },
				{ node: { id: "2", name: "Bob" }, cursor: { i: "2", k: "Bob" } },
			],
			nodes: [
				{ id: "1", name: "Ann" },
				{ id: "2", name: "Bob" },
			],
			pageInfo: {
				hasNextPage: true,
				hasPreviousPage: false,
				limit: 2,
				startCursor: { i: "1", k: "Ann" },
				endCursor: { i: "2", k: "Bob" },
			},
		});
	});

	it("throws when default id extractor cannot read id", () => {
		const descriptor = new PaginationDescriptorByCursor();

		expect(() =>
			descriptor.createInitialResult({ limit: 1 }, [{ code: "x" }], {
				hasNextPage: false,
				hasPreviousPage: false,
			})
		).toThrowError("Entity does not contain `id` field or it is not a string.");
	});
});
