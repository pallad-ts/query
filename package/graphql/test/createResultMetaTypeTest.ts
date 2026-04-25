import {createResultMetaType} from "@src/createResultMetaType";
import {NonNullComposer} from "graphql-compose";
import {printObject} from "graphql-compose/lib/utils/schemaPrinter";
import {GraphQLObjectType} from "graphql/type";
import {createSortTypeBase} from "@src/createSortTypeBase";
import {createResultSortType} from "@src/createResultSortType";
import {createSortFieldType} from "@src/createSortFieldType";
import {SORTABLE_FIELDS} from "./fixtures";
import {getResultMetaFieldsForPaginationByCursor} from "@src/getResultMetaFieldsForPaginationByCursor";
import {GraphQLString} from "graphql";


describe('createResultMetaType', () => {
	const sortType = createResultSortType({
		baseName: 'Base',
		isMulti: true,
		sortFieldType: createSortFieldType('Base', SORTABLE_FIELDS)
	});

	it('returns undefined if no meta fields computed', () => {
		const type = createResultMetaType({
			baseName: 'Base'
		});

		expect(type).toBeUndefined();
	});

	it.each<[string, Omit<createResultMetaType.Options, 'baseName'>]>([
		[
			'with sort type',
			{
				sortType: sortType!
			}
		],
		[
			'with pagination fields',
			{
				paginationFields: getResultMetaFieldsForPaginationByCursor()
			}
		],
		[
			'with extra meta fields',
			{
				extraMetaFields: {
					name: {type: GraphQLString}
				}
			}
		],
		[
			'with all options',
			{
				sortType: sortType!,
				paginationFields: getResultMetaFieldsForPaginationByCursor(),
				extraMetaFields: {
					name: {type: GraphQLString}
				}
			}
		]
	])('creates result meta type: %s', (_, opts) => {
		const type = createResultMetaType({
			baseName: 'Base',
			...opts
		});

		expect(type)
			.toBeInstanceOf(NonNullComposer);

		expect(
			printObject(type!.getUnwrappedTC().getType() as GraphQLObjectType)
		)
			.toMatchSnapshot();
	});
});
