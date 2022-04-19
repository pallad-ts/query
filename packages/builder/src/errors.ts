import {Domain, generators} from "alpha-errors";

export const ERRORS = Domain.create({
	codeGenerator: generators.formatCode('E_QUERY_BUILDER_%d'),
})
	.createErrors(create => {
		return {
			MISSING_SINGLE_SORTING_FOR_CURSOR_PAGINATION: create('Pagination by cursor cannot be used without single field sorting'),
			MULTI_SORTING_FOR_ALLOWED_FOR_CURSOR_PAGINATION: create('Sorting by multiple fields is not allowed in pagination by cursor'),
		}
	})
