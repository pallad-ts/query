import { fromNullable, Maybe } from "@sweet-monads/maybe";
import {
	PaginableByCursor,
	PaginableByOffset,
	Query,
	SortableMulti,
	SortableSingle,
} from "@pallad/query";
import { QueryDescriptor } from "../QueryDescriptor";

export function createResult(
	config: QueryDescriptor.Config,
	resultOptions: QueryDescriptor.ResultOptions<any, any, any>
) {
	let meta: any = {};
	composeMetaForPagination(config.pagination, resultOptions).chain(x =>
		Object.assign(meta, x)
	);
	composeMetaForSorting(config.sorting, resultOptions.query).chain(x => Object.assign(meta, x));

	const hasMeta = Object.keys(meta).length > 0;

	return {
		results: resultOptions.results,
		...(hasMeta ? { meta } : {}),
	};
}

function composeMetaForPagination(
	pagination: QueryDescriptor.Pagination | undefined,
	options: QueryDescriptor.ResultOptions<any, any, any>
) {
	return fromNullable(pagination).map(settings => {
		if (settings.type === "byOffset") {
			const finalQuery = options.query as Required<PaginableByOffset>;
			return {
				limit: finalQuery.limit,
				offset: finalQuery.offset,
			} as PaginableByOffset.ResultMeta;
		}

		const finalQuery = options.query as Required<PaginableByCursor>;
		return {
			limit: finalQuery.limit,
			nextPage: "nextPageCursor" in options ? options.nextPageCursor : undefined,
			previousPage: "previousPageCursor" in options ? options.previousPageCursor : undefined,
		} as PaginableByCursor.ResultMeta;
	});
}

function composeMetaForSorting(
	sorting: QueryDescriptor.Sorting<any> | undefined,
	query: Query<any> & (SortableMulti<any> | SortableSingle<any>)
) {
	return fromNullable(sorting).map(() => {
		return { sortBy: query.sortBy } as
			| SortableSingle.ResultMeta<any>
			| SortableMulti.ResultMeta<any>;
	});
}
