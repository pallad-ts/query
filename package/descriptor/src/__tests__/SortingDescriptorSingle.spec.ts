import { SortingDescriptorSingle } from "../SortingDescriptorSingle";

describe("SortingDescriptorSingle", () => {
	it("keeps config values and freezes instance", () => {
		const descriptor = new SortingDescriptorSingle({
			fields: ["name", "age"],
			default: { field: "name", direction: "ASC" },
		});

		expect(descriptor.fields).toEqual(["name", "age"]);
		expect(descriptor.default).toEqual({ field: "name", direction: "ASC" });
		expect(Object.isFrozen(descriptor)).toBe(true);
	});

	it("parses valid schema input", () => {
		const descriptor = new SortingDescriptorSingle({
			fields: ["name", "age"],
			default: { field: "name", direction: "ASC" },
		});

		expect(
			descriptor.schema.parse({
				sortBy: { field: "age", direction: "DESC" },
			})
		).toEqual({
			sortBy: { field: "age", direction: "DESC" },
		});
	});

	it("rejects unsupported sort field", () => {
		const descriptor = new SortingDescriptorSingle({
			fields: ["name", "age"],
			default: { field: "name", direction: "ASC" },
		});

		expect(() =>
			descriptor.schema.parse({
				sortBy: { field: "createdAt", direction: "ASC" },
			})
		).toThrowError();
	});

	it("creates result metadata from query", () => {
		const descriptor = new SortingDescriptorSingle({
			fields: ["name", "age"],
			default: { field: "name", direction: "ASC" },
		});

		expect(
			descriptor.createMeta({
				sortBy: { field: "name", direction: "ASC" },
			})
		).toEqual({
			sortBy: { field: "name", direction: "ASC" },
		});
	});
});
