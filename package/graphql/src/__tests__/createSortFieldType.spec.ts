import {createSortFieldType} from "@src/createSortFieldType";

describe('createSortFieldType', () => {
	it('fails if sortable fields is empty array', () => {
		expect(() => {
			createSortFieldType('test', []);
		})
			.toThrowErrorMatchingSnapshot();
	});

	it.each([
		[['name', 'last_name']],
		[['first_name', 'id', 'createdAt', 'updatedAt']]
	])('creates enum field with camel cased values: %S', fields => {
		expect(
			createSortFieldType('EntityName', fields)
				.toConfig()
		)
			.toMatchSnapshot();
	});
})
