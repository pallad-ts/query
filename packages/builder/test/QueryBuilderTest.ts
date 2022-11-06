import {QueryConfig} from "@src/QueryConfig";
import * as yup from 'yup';
import {assert, IsExact} from "conditional-type-checks";
import {ViolationsList} from "alpha-validator";
import {PaginableByCursor, PaginableByOffset, Query, SortableMulti, SortableSingle} from "@pallad/query";
import {QueryBuilder} from "@src/QueryBuilder";
import {DEFAULT_SORTING, Filters, SORTABLE_FIELDS} from "./fixtures";
import {Either, left, right} from '@sweet-monads/either';

describe('QueryBuilder', () => {
	describe('filters', () => {
		it('types', () => {
			const builder = new QueryConfig()
				.filters<Filters>()
				.getQueryBuilder();

			type Expected = Promise<Either<ViolationsList, Query<Filters>>>;
			assert<IsExact<ReturnType<typeof builder['build']>, Expected>>(true);
		});

		it('by default accepts all filters', () => {
			const builder = new QueryConfig()
				.getQueryBuilder();

			return expect(builder.build({filters: {literally: 'anything'}}))
				.resolves
				.toEqual(
					right({
						filters: {literally: 'anything'}
					})
				);
		});

		describe('uses filters schema if provided', () => {
			const builder = new QueryConfig()
				.filters<Filters>()
				.getQueryBuilder()
				.filtersSchema(yup.object().shape({
					foo: yup.string().oneOf(['foo']).required(),
					bar: yup.string().oneOf(['bar'])
				}));

			it('success', () => {
				return expect(builder.build({
					filters: {
						foo: 'foo',
						bar: 'bar'
					}
				}))
					.resolves
					.toEqual(right({
						filters: {foo: 'foo', bar: 'bar'}
					}));
			});

			it('failure', async () => {
				const result = await builder.build({filters: {}});

				expect(result.isLeft())
					.toBe(true);

				expect(result.value)
					.toMatchSnapshot();
			});
		});
	});

	describe('pagination', () => {
		describe.each<[string, QueryBuilder<any>]>([
			[
				'by cursor',
				new QueryConfig()
					.cursorPagination()
					.singleSorting(
						['foo', 'bar'],
						{field: 'foo', direction: 'ASC'}
					)
					.getQueryBuilder()],
			[
				'by offset',
				new QueryConfig()
					.offsetPagination()
					.getQueryBuilder()
			],
		])('common (for %s)', (name, qb) => {
			it('limit cannot be lower than 1', async () => {
				const result = await qb.build({limit: 0})
				expect(result.value)
					.toMatchSnapshot();
			});

			it('uses default limit', async () => {
				const result = await qb.build({})
				expect(result.value)
					.toMatchObject({limit: 50});
			});

			it('limit cannot be greater than max limit', async () => {
				const result = await qb.build({limit: 5000})
				expect(result.value)
					.toMatchSnapshot();
			});

			it('limit must be integer', async () => {
				const result = await qb.build({limit: 'asdfa'})
				expect(result.value)
					.toMatchSnapshot();
			});
		});

		describe('by cursor', () => {
			const builder = new QueryConfig()
				.cursorPagination()
				.singleSorting(SORTABLE_FIELDS.slice(), DEFAULT_SORTING)
				.getQueryBuilder();

			it('types', () => {
				type Expected = Promise<Either<ViolationsList, Query<unknown> & PaginableByCursor & SortableSingle<'foo' | 'bar'>>>;

				assert<IsExact<ReturnType<typeof builder['build']>, Expected>>(true);
			});

			describe.each([
				['after'],
				['before']
			])('allows "%s" cursor property', property => {
				it('fails if not a string', async () => {
					const result = await builder.build({[property]: []})
					expect(result.value)
						.toMatchSnapshot();
				});

				it('success', () => {
					const value = `${property} cursor`;
					return expect(builder.build({[property]: value}))
						.resolves
						.toEqual(right({
							filters: {},
							[property]: value,
							limit: 50,
							sortBy: DEFAULT_SORTING
						}))
				});
			})
		});

		describe('by offset', () => {
			const builder = new QueryConfig()
				.offsetPagination()
				.getQueryBuilder();

			it('types', () => {
				type Expected = Promise<Either<ViolationsList, Query<unknown> & PaginableByOffset>>;
				assert<IsExact<ReturnType<typeof builder['build']>, Expected>>(true);
			});

			it('offset by default is 0', () => {
				return expect(builder.build({}))
					.resolves
					.toEqual(
						right({
							filters: {},
							limit: 50,
							offset: 0
						})
					);
			});

			it('offset cannot be lower than 0', async () => {
				const result = await builder.build({offset: -1});
				expect(result.value)
					.toMatchSnapshot();
			});

			it('offset must be an integer', async () => {
				const result = await builder.build({offset: 'asdfasdf'});
				expect(result.value)
					.toMatchSnapshot();
			});
		});
	});

	describe('sorting', () => {


		describe.each([
			['single', new QueryConfig().singleSorting(SORTABLE_FIELDS.slice(), DEFAULT_SORTING).getQueryBuilder()],
			['multi', new QueryConfig().multiSorting(SORTABLE_FIELDS.slice(), [DEFAULT_SORTING]).getQueryBuilder()]
		])('common (for %s)', (name, qb) => {
			const isMulti = name === 'multi';

			function testCase(sorting: any) {
				return qb.build({sortBy: isMulti ? [sorting] : sorting});
			}

			it('forces to use only allowed sortable fields', async () => {
				const result = await testCase({field: 'unsupported', direction: 'ASC'});

				expect(result.value)
					.toMatchSnapshot();
			});

			it('sortable field is required', async () => {
				const result = await testCase({direction: 'ASC'});

				expect(result.value)
					.toMatchSnapshot();
			});

			it('sorting direction is required', async () => {
				const result = await testCase({field: 'foo'});

				expect(result.value)
					.toMatchSnapshot();
			});

			it('fails for invalid sorting direction', async () => {
				const result = await testCase({field: 'foo', direction: 'bas'});

				expect(result.value)
					.toMatchSnapshot();
			});


			it.each([
				['ASC'],
				['DESC']
			])('sorting direction must be ASC or DESC', direction => {
				let sorting = {field: 'foo', direction};
				return expect(testCase(sorting))
					.resolves
					.toEqual(right({
						filters: {},
						sortBy: isMulti ? [sorting] : sorting
					}));
			})


			it('applies default sorting if not explicitly set', () => {
				return expect(qb.build({}))
					.resolves
					.toEqual(right({
						filters: {},
						sortBy: isMulti ? [DEFAULT_SORTING] : DEFAULT_SORTING
					}))
			});
		});

		describe('single', () => {
			const builder = new QueryConfig()
				.singleSorting(SORTABLE_FIELDS.slice(), DEFAULT_SORTING)
				.getQueryBuilder();

			it('types', () => {
				type Expected = Promise<Either<ViolationsList, Query<unknown> & SortableSingle<'foo' | 'bar'>>>
				assert<IsExact<ReturnType<typeof builder['build']>, Expected>>(true)
			});
		});

		describe('multi', () => {
			const builder = new QueryConfig()
				.multiSorting(SORTABLE_FIELDS.slice(), [DEFAULT_SORTING])
				.getQueryBuilder()

			it('types', () => {
				type Expected = Promise<Either<ViolationsList, Query<unknown> & SortableMulti<'foo' | 'bar'>>>
				assert<IsExact<ReturnType<typeof builder['build']>, Expected>>(true)
			});

			it('sorting array cannot be empty', async () => {
				const result = await builder.build({
					sortBy: []
				});
				expect(result.value)
					.toMatchSnapshot();
			});
		});
	});
});

