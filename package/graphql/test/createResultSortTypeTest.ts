import {createSortFieldType} from "@src/createSortFieldType";
import {SORTABLE_FIELDS} from "./fixtures";
import {createResultSortType} from "@src/createResultSortType";
import {printObject,} from "graphql-compose/lib/utils/schemaPrinter";
import {GraphQLObjectType} from "graphql/type";

describe('createResultSortType', () => {
	const sortFieldType = createSortFieldType('Base', SORTABLE_FIELDS);
	it.each<[{ isMulti: boolean }]>([
		[{isMulti: true}],
		[{isMulti: false}],
	])('crates object type: %s', opts => {
		const type = createResultSortType({
			baseName: 'Base',
			sortFieldType,
			...opts
		});

		expect(
			printObject(type.getUnwrappedTC().getType() as GraphQLObjectType)
		)
			.toMatchSnapshot();

		expect(
			printObject(
				new GraphQLObjectType({
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
})
