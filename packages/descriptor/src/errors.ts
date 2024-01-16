import { Domain, ErrorDescriptor, formatCodeFactory } from "@pallad/errors";

const code = formatCodeFactory("E_QUERY_BUILDER_%c");
export const errorsDomain = new Domain();
export const ERRORS = errorsDomain.addErrorsDescriptorsMap({
	MISSING_SINGLE_SORTING_FOR_CURSOR_PAGINATION: ErrorDescriptor.useDefaultMessage(
		code(1),
		"Pagination by cursor cannot be used without single field sorting"
	),
	MULTI_SORTING_FOR_ALLOWED_FOR_CURSOR_PAGINATION: ErrorDescriptor.useDefaultMessage(
		code(2),
		"Sorting by multiple fields is not allowed in pagination by cursor"
	),
	SORTABLE_FIELDS_LIST_CANNOT_BE_EMPTY: ErrorDescriptor.useDefaultMessage(
		code(3),
		"Sortable fields list cannot be empty"
	),
});
