import { PaginationDescriptorByOffset } from "../PaginationDescriptorByOffset";

describe("PaginationDescriptorByOffset", () => {
	it("uses default config values and freezes instance", () => {
		const descriptor = new PaginationDescriptorByOffset();

		expect(descriptor.defaultLimit).toBe(20);
		expect(descriptor.maxLimit).toBe(1000);
		expect(descriptor.maxOffset).toBeUndefined();
		expect(Object.isFrozen(descriptor)).toBe(true);
	});

	it("parses valid input and applies defaults", () => {
		const descriptor = new PaginationDescriptorByOffset({
			defaultLimit: 15,
			maxOffset: 30,
		});

		expect(descriptor.schema.parse({})).toEqual({
			offset: 0,
			limit: 15,
		});
	});

	it("rejects offset above maxOffset", () => {
		const descriptor = new PaginationDescriptorByOffset({
			defaultLimit: 10,
			maxOffset: 20,
		});

		expect(() => descriptor.schema.parse({ offset: 21, limit: 5 })).toThrowError();
	});

	it("creates offset pagination result", () => {
		const descriptor = new PaginationDescriptorByOffset();

		expect(
			descriptor.createInitialResult({ offset: 5, limit: 2 }, [{ id: "1" }, { id: "2" }], {
				hasNextPage: true,
				hasPreviousPage: false,
			})
		).toEqual({
			list: [{ id: "1" }, { id: "2" }],
			pageInfo: {
				limit: 2,
				offset: 5,
				hasNextPage: true,
				hasPreviousPage: false,
			},
		});
	});
});
