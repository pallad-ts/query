import { ERRORS } from "../errors";

export function validateSortableFields<T>(fields: T[]): asserts fields is [T, ...T[]] {
	if (fields.length === 0) {
		throw ERRORS.SORTABLE_FIELDS_LIST_CANNOT_BE_EMPTY.create();
	}
}
