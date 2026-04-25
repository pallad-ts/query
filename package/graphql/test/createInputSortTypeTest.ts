import {createSortFieldType} from "@src/createSortFieldType";
import {SORTABLE_FIELDS} from "./fixtures";
import {printInputObject} from "graphql-compose/lib/utils/schemaPrinter";
import {createInputSortType} from "@src/createInputSortType";
import {GraphQLInputObjectType} from "graphql";

describe('createInputSortType', () => {
	const sortFieldType = createSortFieldType('Base', SORTABLE_FIELDS);
	it.each<[{ isMulti: boolean }]>([
		[{isMulti: true}],
		[{isMulti: false}]
	])('creates input sort type', opts => {
		const type = createInputSortType({
			baseName: 'Base',
			sortFieldType,
			...opts
		});

		const unwrappedType = 'getUnwrappedTC' in type ? type.getUnwrappedTC().getType() as GraphQLInputObjectType : type.getType();
		expect(printInputObject(unwrappedType))
			.toMatchSnapshot();

		expect(
			printInputObject(
				new GraphQLInputObjectType({
					name: 'Base',
					fields: {
						sortBy: {
							type: type.getType()
						}
					}
				})
			)
		)
			.toMatchSnapshot();
	})
});
