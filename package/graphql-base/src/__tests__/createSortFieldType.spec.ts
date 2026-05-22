import { createSortFieldType } from "../createSortFieldType";

describe("createSortFieldType", () => {
	it("fails if sortable fields is empty array", () => {
		expect(() => {
			createSortFieldType("test", []);
		}).toThrowErrorMatchingInlineSnapshot(
			`[Error: Assertion failed. Must be not an empty array]`
		);
	});

	it.each<[readonly string[]]>([
		[["name", "last_name"]],
		[["first_name", "id", "createdAt", "updatedAt"]],
	])(
		"creates enum field with camel cased values: %j",
		fields => {
			expect(createSortFieldType("EntityName", fields).toConfig()).toMatchSnapshot();
		}
	);
});
