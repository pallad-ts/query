import {PaginableByCursor, PaginableByOffset, Query, Result, ResultMeta, SortableFieldDefinition, SortableMulti, SortableSingle} from "@pallad/query";
import {QueryConfig} from "./QueryConfig";
import {Builder} from "@pallad/builder";
import {Maybe} from "monet";

export class ResultBuilder<T extends QueryConfig<any, any>, TDefaultEntity> extends Builder {
	constructor(readonly config: T) {
		super();
	}

	build<TEntity = TDefaultEntity>(options: ResultBuilder.Options<TEntity, T['query']>) {
		let meta: any = {};
		this.composeMetaForPagination(options).foldLeft(meta)(Object.assign)
		this.composeMetaForSorting(options).foldLeft(meta)(Object.assign);

		const hasMeta = Object.keys(meta).length > 0;

		return {
			results: options.results,
			...(hasMeta ? {meta} : {})
		} as Result<TEntity> & (T['resultMeta'] extends {} ? ResultMeta<T['resultMeta']> : unknown);
	}

	private composeMetaForPagination(options: ResultBuilder.Options<unknown, any>): Maybe<PaginableByCursor.ResultMeta | PaginableByOffset.ResultMeta> {
		return Maybe.fromUndefined(this.config.getPagination())
			.map(settings => {
				if (settings.type === 'byOffset') {
					const query = options.query as Required<PaginableByOffset>;
					return {
						limit: query.limit,
						offset: query.offset
					} as PaginableByOffset.ResultMeta;
				}

				const query = options.query as Required<PaginableByCursor>;
				return {
					limit: query.limit,
					nextPage: options.nextPageCursor,
					previousPage: options.previousPageCursor
				} as PaginableByCursor.ResultMeta;
			});
	}

	private composeMetaForSorting({query}: ResultBuilder.Options<unknown, any>): Maybe<SortableSingle.ResultMeta<any> | SortableMulti.ResultMeta<any>> {
		return Maybe.fromUndefined(this.config.getSorting())
			.map(() => {
				return {sortBy: query.sortBy}
			});
	}
}

export namespace ResultBuilder {
	export interface Options<TEntity, TQuery extends Query<any>> {
		results: TEntity[];
		query: TQuery;
		nextPageCursor?: string;
		previousPageCursor?: string;
	}
}

type Test<T> = { foo: 'bar' } & (T extends {} ? { bar: T } : unknown);

const o: Test<{ zee: 'zee' }> = {
	foo: 'bar',
	bar: {zee: 'zee'}
}

const o2: Test<unknown> = {
	foo: 'bar'
}
