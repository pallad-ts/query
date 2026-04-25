import {GraphQLObjectType} from "graphql/type";
import {GraphQLString} from "graphql";
import {createResultListType} from "@src/createResultListType";
import {ObjectTypeComposer} from "graphql-compose";
import {printObject} from "graphql-compose/lib/utils/schemaPrinter";

describe('createResultListType', () => {
	function assertValidType(type: any) {
		const objectType = ObjectTypeComposer.createTemp({
			name: 'BaseWrapper',
			fields: {
				results: type
			}
		});

		expect(printObject(objectType.getType()))
			.toMatchSnapshot();
	}

	it('from raw GraphQL type', () => {
		const entity = new GraphQLObjectType({
			name: 'Base',
			fields: {
				foo: {type: GraphQLString}
			}
		});

		const result = createResultListType(entity);
		assertValidType(result);
	});

	it('from type composer', () => {
		const entity = ObjectTypeComposer.createTemp({
			name: 'Base',
			fields: {
				foo: GraphQLString
			}
		});

		const result = createResultListType(entity);
		assertValidType(result);
	});
});
