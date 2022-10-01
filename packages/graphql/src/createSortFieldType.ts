import {GraphQLEnumType} from "graphql";
import * as is from 'predicates'
import {camelCase} from "camel-case";

const assertSortableFields = is.assert(is.notEmptyArr);

/**
 * Creates enum for sortable fields
 */
export function createSortFieldType(baseName: string, sortableFields: readonly string[]) {
	assertSortableFields(sortableFields);
	return new GraphQLEnumType({
		name: `${baseName}_Sort_Field`,
		values: Object.fromEntries(
			sortableFields.map(x => {
				return [camelCase(x), {value: x}]
			})
		)
	})
}
