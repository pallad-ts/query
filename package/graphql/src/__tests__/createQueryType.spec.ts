import {createQueryType} from "@src/createQueryType";
import {GraphQLInputObjectType, GraphQLNonNull, GraphQLString} from "graphql";
import {createInputSortType} from "@src/createInputSortType";
import {createSortFieldType} from "@src/createSortFieldType";
import {SORTABLE_FIELDS} from "./fixtures";
import {getQueryFieldsForPaginationByCursor} from "@src/getQueryFieldsForPaginationByCursor";
import {printInputObject} from "graphql-compose/lib/utils/schemaPrinter";

describe('createQueryType', () => {
	const filtersType = new GraphQLInputObjectType({
		name: 'Base_Filters',
		fields: {
			name: {type: new GraphQLNonNull(GraphQLString)}
		}
	});

	const sortType = createInputSortType({
		baseName: 'Base',
		sortFieldType: createSortFieldType('Base', SORTABLE_FIELDS),
		isMulti: false
	});

	it.each<[string, Omit<createQueryType.Options<any>, 'baseName'>]>([
		[
			'simple',
			{
				filtersType,
			}
		],
		[
			'with sort type',
			{
				filtersType,
				sortType
			}
		],
		[
			'with pagination fields',
			{
				filtersType,
				paginationFields: getQueryFieldsForPaginationByCursor()
			}
		],
		[
			'with all options',
			{
				filtersType,
				sortType,
				paginationFields: getQueryFieldsForPaginationByCursor()
			}
		]
	])('created query input type', (_, opts) => {
		expect(
			printInputObject(
				createQueryType({
					baseName: 'Base',
					...opts
				}).getType()
			)
		)
			.toMatchSnapshot();
	})
});
