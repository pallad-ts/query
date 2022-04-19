import {QueryConfig} from "@src/QueryConfig";
import {assert, IsExact} from "conditional-type-checks";
import {PaginableByCursor, PaginableByOffset, Query, SortableMulti, SortableSingle} from "@pallad/query";
import {QueryBuilder} from "@src/QueryBuilder";
import {ResultBuilder} from "@src/ResultBuilder";
import {Filters} from "./fixtures";

describe('QueryConfig', () => {
	describe('pagination', () => {
		it('by default not set', () => {
			const config = new QueryConfig();
			expect(config.getPagination())
				.toBeUndefined();
		});

		describe('by cursor', () => {
			it('types', () => {
				const config = new QueryConfig().cursorPagination();
				type ExpectedQuery = Query<unknown> & PaginableByCursor;
				type ExpectedResultMeta = PaginableByCursor.ResultMeta;

				assert<IsExact<typeof config['query'], ExpectedQuery>>(true);
				assert<IsExact<typeof config['resultMeta'], ExpectedResultMeta>>(true);
			})

			it('applies default config if not set explicitly', () => {
				const config = new QueryConfig().cursorPagination();

				expect(config.getPagination())
					.toEqual({
						type: 'byCursor',
						defaultLimit: 50,
						maxLimit: 1000
					})
			});

			it('merges with default settings', () => {
				const config = new QueryConfig().cursorPagination({defaultLimit: 10});

				expect(config.getPagination())
					.toEqual({
						type: 'byCursor',
						defaultLimit: 10,
						maxLimit: 1000
					});
			});
		});

		describe('by offset', () => {
			it('types', () => {
				const config = new QueryConfig().offsetPagination();
				type ExpectedQuery = Query<unknown> & PaginableByOffset;
				type ExpectedResultMeta = PaginableByOffset.ResultMeta;

				assert<IsExact<typeof config['query'], ExpectedQuery>>(true);
				assert<IsExact<typeof config['resultMeta'], ExpectedResultMeta>>(true);
			})

			it('applies default config if not set explicitly', () => {
				const config = new QueryConfig().offsetPagination();

				expect(config.getPagination())
					.toEqual({
						type: 'byOffset',
						defaultLimit: 50,
						maxLimit: 1000
					})
			});

			it('merges with default settings', () => {
				const config = new QueryConfig().offsetPagination({defaultLimit: 10});

				expect(config.getPagination())
					.toEqual({
						type: 'byOffset',
						defaultLimit: 10,
						maxLimit: 1000
					});
			});
		});
	});

	describe('sorting', () => {
		it('by default not set', () => {
			const config = new QueryConfig();
			expect(config.getSorting())
				.toBeUndefined();
		});

		describe('single', () => {
			const config = new QueryConfig()
				.singleSorting(['foo', 'bar'], {field: 'foo', direction: 'ASC'});

			it('types', () => {
				type ExpectedQuery = Query<unknown> & SortableSingle<'foo' | 'bar'>;
				type ExpectedResultMeta = SortableSingle.ResultMeta<'foo' | 'bar'>;

				assert<IsExact<typeof config['query'], ExpectedQuery>>(true);
				assert<IsExact<typeof config['resultMeta'], ExpectedResultMeta>>(true);
			});

			it('getting config', () => {
				expect(config.getSorting())
					.toEqual({
						type: 'single',
						sortableFields: ['foo', 'bar'],
						defaultSorting: {field: 'foo', direction: 'ASC'}
					});
			});
		});

		describe('multi', () => {
			const config = new QueryConfig()
				.multiSorting(['foo', 'bar'], [
					{field: 'foo', direction: 'ASC'},
					{field: 'bar', direction: 'DESC'}
				]);

			it('types', () => {
				type ExpectedQuery = Query<unknown> & SortableMulti<'foo' | 'bar'>;
				type ExpectedResultMeta = SortableMulti.ResultMeta<'foo' | 'bar'>;

				assert<IsExact<typeof config['query'], ExpectedQuery>>(true);
				assert<IsExact<typeof config['resultMeta'], ExpectedResultMeta>>(true);
			});

			it('getting config', () => {
				expect(config.getSorting())
					.toEqual({
						type: 'multi',
						sortableFields: ['foo', 'bar'],
						defaultSorting: [
							{field: 'foo', direction: 'ASC'},
							{field: 'bar', direction: 'DESC'}
						]
					});
			});
		});
	});

	describe('filters', () => {
		it('just changes type of filters', () => {
			const config = new QueryConfig()
				.filters<Filters>();

			type Expected = Query<Filters>;
			assert<IsExact<typeof config['query'], Expected>>(true);
		});
	});

	describe('query builder', () => {
		it('required config to be valid before returning query builder', () => {
			expect(() => {
				new QueryConfig().cursorPagination().getQueryBuilder();
			})
				.toThrowErrorMatchingSnapshot();
		});

		it('types', () => {
			const builder = new QueryConfig()
				.singleSorting(['foo', 'bar'], {field: 'bar', direction: 'ASC'})
				.filters<Filters>()
				.getQueryBuilder();

			type Expected = QueryBuilder<QueryConfig<Filters, SortableSingle<'foo' | 'bar'>>>;
			assert<IsExact<typeof builder, Expected>>(true);
		});
	});

	describe('result builder', () => {
		it('required config to be valid before returning result builder', () => {
			expect(() => {
				new QueryConfig().cursorPagination().getResultBuilder();
			})
				.toThrowErrorMatchingSnapshot();
		});

		it('types', () => {
			const builder = new QueryConfig()
				.singleSorting(['foo', 'bar'], {field: 'bar', direction: 'ASC'})
				.cursorPagination()
				.filters<Filters>()
				.getResultBuilder();

			type Expected = ResultBuilder<QueryConfig<Filters, SortableSingle<'foo' | 'bar'> & PaginableByCursor>>;
			assert<IsExact<typeof builder, Expected>>(true);
		});
	});

	describe('validation', () => {
		it('pagination by cursor cannot be used without single sorting setup', () => {
			expect(() => {
				new QueryConfig().cursorPagination().validate();
			})
				.toThrowErrorMatchingSnapshot();
		});

		it('pagination by cursor cannot be used with multi sorting', () => {
			expect(() => {
				new QueryConfig()
					.cursorPagination()
					.multiSorting(['foo', 'bar'], [{field: 'foo', direction: 'ASC'}]).validate();
			})
				.toThrowErrorMatchingSnapshot();
		});
	})
});
