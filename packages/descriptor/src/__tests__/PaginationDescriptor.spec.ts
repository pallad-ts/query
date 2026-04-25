import { DEFAULT_LIMIT, DEFAULT_MAX_LIMIT, PaginationDescriptor } from "../PaginationDescriptor";
import { PaginationDescriptorByCursor } from "../PaginationDescriptorByCursor";
import { PaginationDescriptorByOffset } from "../PaginationDescriptorByOffset";

describe("PaginationDescriptor", () => {
	it("exposes expected default constants", () => {
		expect(DEFAULT_LIMIT).toBe(20);
		expect(DEFAULT_MAX_LIMIT).toBe(1000);
	});

	it("is implemented by cursor and offset descriptors", () => {
		const cursor = new PaginationDescriptorByCursor();
		const offset = new PaginationDescriptorByOffset();

		const asPaginationDescriptor = <TInput, TOutput>(
			descriptor: PaginationDescriptor<TInput, TOutput>
		) => descriptor;

		expect(asPaginationDescriptor(cursor)).toBe(cursor);
		expect(asPaginationDescriptor(offset)).toBe(offset);
	});
});
