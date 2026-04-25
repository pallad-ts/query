import { SortingDescriptor } from "../SortingDescriptor";
import { SortingDescriptorMulti } from "../SortingDescriptorMulti";
import { SortingDescriptorSingle } from "../SortingDescriptorSingle";

describe("SortingDescriptor", () => {
	it("is implemented by single and multi descriptors", () => {
		const single = new SortingDescriptorSingle({
			fields: ["name", "age"],
			default: { field: "name", direction: "ASC" },
		});
		const multi = new SortingDescriptorMulti({
			sortableFields: ["name", "age"],
			defaultSorting: [{ field: "name", direction: "ASC" }],
		});

		const asSortingDescriptor = <TField extends string, TInput, TOutput>(
			descriptor: SortingDescriptor<TField, TInput, TOutput>
		) => descriptor;

		expect(asSortingDescriptor(single)).toBe(single);
		expect(asSortingDescriptor(multi)).toBe(multi);
	});
});
