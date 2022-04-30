import {assert, IsExact} from "conditional-type-checks";
import {QueryConfig} from "@src/QueryConfig";
import {PaginableByCursor, PaginableByOffset, Query, Result, ResultMeta, SortableMulti, SortableSingle} from "@pallad/query";
import {DEFAULT_SORTING, SORTABLE_FIELDS} from "./fixtures";

describe('ResultBuilder', () => {
	describe('none of options selected', () => {
		const builder = new QueryConfig().getResultBuilder();
		it('types', () => {
			type Expected = Result<unknown>;
			type Input = ReturnType<typeof builder['build']>;
			assert<IsExact<Input, Expected>>(true);
		});

		it('building result', () => {
			expect(builder.build({
				results: [1, 2],
				query: {
					filters: {}
				},
				nextPageCursor: 'nextPage',
				previousPageCursor: 'previousPage'
			}))
				.toEqual({
					results: [1, 2]
				});
		});
	});

	describe('cursor pagination', () => {
		const builder = new QueryConfig()
			.cursorPagination()
			.singleSorting(
				SORTABLE_FIELDS.slice(),
				DEFAULT_SORTING
			)
			.getResultBuilder();


		it('types', () => {
			type Expected = Result<unknown> & ResultMeta<PaginableByCursor.ResultMeta & SortableSingle.ResultMeta<'foo' | 'bar'>>;
			type Input = ReturnType<typeof builder['build']>;

			assert<IsExact<Input, Expected>>(true);
		});

		it('building result', () => {
			expect(builder.build({
				results: [1, 2],
				query: {
					filters: {},
					limit: 10,
					sortBy: DEFAULT_SORTING,
					after: 'after',
					before: 'before'
				},
				nextPageCursor: 'nextPage',
				previousPageCursor: 'previousPage'
			}))
				.toEqual({
					results: [1, 2],
					meta: {
						limit: 10,
						nextPage: 'nextPage',
						previousPage: 'previousPage',
						sortBy: DEFAULT_SORTING
					}
				});
		});
	});

	describe('offset pagination', () => {
		const builder = new QueryConfig()
			.offsetPagination()
			.getResultBuilder<number>();

		it('types', () => {
			type Expected = Result<number> & ResultMeta<PaginableByOffset.ResultMeta>;
			type Input = ReturnType<typeof builder['build']>;

			assert<IsExact<Input, Expected>>(true);
		});

		it('building result', () => {
			expect(builder.build({
				results: [1, 2],
				query: {
					filters: {},
					limit: 10,
					offset: 10
				},
				nextPageCursor: 'nextPage',
				previousPageCursor: 'previousPage'
			}))
				.toEqual({
					results: [1, 2],
					meta: {
						limit: 10,
						offset: 10,
					}
				});
		});
	});

	describe('multi sorting', () => {
		const builder = new QueryConfig()
			.multiSorting(
				SORTABLE_FIELDS.slice(),
				[DEFAULT_SORTING]
			)
			.getResultBuilder();


		it('types', () => {
			type Expected = Result<unknown> & ResultMeta<SortableMulti.ResultMeta<'foo' | 'bar'>>;
			type Input = ReturnType<typeof builder['build']>;

			assert<IsExact<Input, Expected>>(true);
		});

		it('building result', () => {
			expect(builder.build({
				results: [1, 2],
				query: {
					filters: {},
					sortBy: [
						{field: 'foo', direction: 'ASC'},
						{field: 'bar', direction: 'DESC'}
					],
				},
				nextPageCursor: 'nextPage',
				previousPageCursor: 'previousPage'
			}))
				.toEqual({
					results: [1, 2],
					meta: {
						sortBy: [
							{field: 'foo', direction: 'ASC'},
							{field: 'bar', direction: 'DESC'}
						]
					}
				});
		});
	});
});
