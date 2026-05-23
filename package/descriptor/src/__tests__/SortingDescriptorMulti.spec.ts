import { SortingDescriptorMulti } from "../SortingDescriptorMulti";

describe("SortingDescriptorMulti", () => {
	it("keeps config values", () => {
		const descriptor = new SortingDescriptorMulti({
			sortableFields: ["name", "age"],
			defaultSorting: [{ field: "name", direction: "ASC" }],
		});

		expect(descriptor.fields).toEqual(["name", "age"]);
		expect(descriptor.default).toEqual([{ field: "name", direction: "ASC" }]);
	});

	it("parses valid schema input", () => {
		const descriptor = new SortingDescriptorMulti({
			sortableFields: ["name", "age"],
			defaultSorting: [{ field: "name", direction: "ASC" }],
		});

		expect(
			descriptor.schema.parse({
				sortBy: [{ field: "age", direction: "DESC" }],
			})
		).toEqual({
			sortBy: [{ field: "age", direction: "DESC" }],
		});
	});

	it("uses default sorting when input omits sortBy", () => {
		const descriptor = new SortingDescriptorMulti({
			sortableFields: ["name", "age"],
			defaultSorting: [{ field: "name", direction: "ASC" }],
		});

		expect(descriptor.schema.parse({})).toEqual({
			sortBy: [{ field: "name", direction: "ASC" }],
		});
	});

	it("rejects empty sort list", () => {
		const descriptor = new SortingDescriptorMulti({
			sortableFields: ["name", "age"],
			defaultSorting: [{ field: "name", direction: "ASC" }],
		});

		expect(() => descriptor.schema.parse({ sortBy: [] })).toThrowError();
	});

	it("creates result metadata from query", () => {
		const descriptor = new SortingDescriptorMulti({
			sortableFields: ["name", "age"],
			defaultSorting: [{ field: "name", direction: "ASC" }],
		});

		expect(
			descriptor.createMeta({
				sortBy: [
					{ field: "name", direction: "ASC" },
					{ field: "age", direction: "DESC" },
				],
			})
		).toEqual({
			sortBy: [
				{ field: "name", direction: "ASC" },
				{ field: "age", direction: "DESC" },
			],
		});
	});
});
