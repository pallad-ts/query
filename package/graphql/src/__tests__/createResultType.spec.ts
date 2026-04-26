import {createResultType} from "@src/createResultType";
import {GraphQLObjectType} from "graphql/type";
import {GraphQLString} from "graphql";
import {createResultMetaType} from "@src/createResultMetaType";
import {getResultMetaFieldsForPaginationByCursor} from "@src/getResultMetaFieldsForPaginationByCursor";
import {printObject} from "graphql-compose/lib/utils/schemaPrinter";

describe('createResultType', () => {
	const entityType = new GraphQLObjectType({
		name: 'Entity',
		fields: {
			name: {type: GraphQLString}
		}
	});

	it.each<[string, Omit<createResultType.Options<any, any>, 'baseName'>]>([
		[
			'simple', {
			entityType
		}
		],
		[
			'with meta',
			{
				entityType,
				metaType: createResultMetaType({
					baseName: 'Base',
					paginationFields: getResultMetaFieldsForPaginationByCursor()
				})
			}
		]
	])('creates result type: %s', (_, opts) => {
		expect(
			printObject(
				createResultType({
					baseName: 'Base',
					...opts
				})
					.getUnwrappedTC()
					.getType() as GraphQLObjectType
			)
		)
			.toMatchSnapshot();
	});
});
