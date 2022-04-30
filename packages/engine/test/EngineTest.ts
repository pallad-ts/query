import {Engine} from "@src/Engine";
import {Query as _Query, Result, ResultMeta} from "@pallad/query";
import {assert, IsExact} from "conditional-type-checks";
import * as sinon from 'sinon';
import {ERRORS} from "@src/errors";

describe('Engine', () => {
	class Entity {
		readonly id!: string;
	}

	interface Context {
		zee: 'zee',
	}

	type Query = _Query<{
		foo: 'foo';
		bar: 'bar';
	}>;

	type AnotherQuery = _Query<{
		another: 'query'
	}>;

	interface ResultMetaFields {
		foo: 'bar'
	}

	const EMPTY_QUERY: _Query<any> = {filters: {}};

	const EMPTY_RESULT: Result<any> = {results: []};

	describe('types', () => {

		it('no types provided', () => {
			const engine = new Engine();

			type Expected = Engine<_Query<any>, object, Result<unknown>>;
			assert<IsExact<typeof engine, Expected>>(true);

			assert<IsExact<ReturnType<(typeof engine)['find']>, Promise<Result<unknown>>>>(true);
		});

		describe('with context factory', () => {
			it('with context factory query arg', () => {
				const engine = new Engine()
					.useContextFactory((query: Query) => {
						return {zee: 'zee'} as Context
					});

				type Expected = Engine<Query, Context, Result<unknown>>;
				assert<IsExact<typeof engine, Expected>>(true);
			});

			it('with async context factory query arg', () => {
				const engine = new Engine()
					// eslint-disable-next-line @typescript-eslint/require-await
					.useContextFactory(async (query: Query) => {
						return {zee: 'zee'} as Context
					});

				type Expected = Engine<Query, Context, Result<any>>;
				assert<IsExact<typeof engine, Expected>>(true);
			});

			it('context factory query arg overrides engine query type', () => {
				const engine = new Engine<AnotherQuery>()
					.useContextFactory((query: Query) => {
						return {zee: 'zee'} as Context
					});

				type Expected = Engine<Query, Context, Result<any>>;
				assert<IsExact<typeof engine, Expected>>(true);
			});

			it('without context factory query arg takes default query type from constructors', () => {
				const engine = new Engine()
					.useContextFactory(() => {
						return {zee: 'zee'} as Context
					});

				type Expected = Engine<_Query<unknown>, Context, Result<any>>;
				assert<IsExact<typeof engine, Expected>>(true);
			});

			it('without context factory query arg takes query type from constructor', () => {
				const engine = new Engine<Query>()
					.useContextFactory(() => {
						return {zee: 'zee'} as Context
					})

				type Expected = Engine<Query, Context, Result<any>>;
				assert<IsExact<typeof engine, Expected>>(true);
			});
		});

		describe('result factory', () => {
			it('default result type', () => {
				const engine = new Engine();

				assert<IsExact<Result<unknown>, typeof engine['result']>>(true);
			});

			it('overriding result type from result factory', () => {
				const engine = new Engine()
					.useResultFactory(() => {
						return {} as Result<Entity> & ResultMeta<ResultMetaFields>;
					});

				assert<IsExact<Result<Entity> & ResultMeta<ResultMetaFields>, typeof engine['result']>>(true);
			})
		});
	});

	describe('context', () => {
		it('uses default context if context factory is not provided', async () => {
			const stub = sinon.stub();
			const engine = new Engine();
			engine.use(stub);
			await engine.find(EMPTY_QUERY);

			sinon.assert.calledWith(stub, {query: EMPTY_QUERY});
		});

		it('merges context from factory and query context', async () => {
			const stub = sinon.stub();
			const context = {foo: 'foo'};
			const engine = new Engine()
				.useContextFactory(() => {
					return context;
				})
			engine.use(stub);
			await engine.find(EMPTY_QUERY);
			sinon.assert.calledWith(stub, {...context, query: EMPTY_QUERY});
		});

		it('query in context cannot be overriden by context factory', async () => {
			const stub = sinon.stub();
			const context = {foo: 'foo'};
			const engine = new Engine()
				.useContextFactory(() => {
					return {...context, query: {filters: {test: 1}}};
				})
			engine.use(stub);
			await engine.find(EMPTY_QUERY);
			sinon.assert.calledWith(stub, {...context, query: EMPTY_QUERY});
		});
	});

	describe('finding', () => {
		it('throw an error if there are no middlewares', () => {
			const engine = new Engine();
			expect(engine.find(EMPTY_QUERY))
				.rejects
				.toThrowError(ERRORS.NO_MIDDLEWARES.defaultMessage)
		});

		it('throw an error if there are no more middlewares to call', () => {
			const stub = sinon.stub().yields();
			const engine = new Engine();
			engine.use(stub);
			expect(engine.find(EMPTY_QUERY))
				.rejects
				.toThrowError(ERRORS.NO_FURTHER_MIDDLEWARE.defaultMessage);
		});
	});

	describe('middlewares', () => {
		it('calls middlewares in order or registration and returns their result', async () => {

			const m1 = sinon.stub().yields();
			const m2 = sinon.stub().yields();
			const m3 = sinon.stub().returns(EMPTY_RESULT);
			const engine = new Engine()
				.use(m1)
				.use(m2)
				.use(m3);

			const result = await engine.find(EMPTY_QUERY);

			sinon.assert.callOrder(m1, m2, m3);

			expect(result)
				.toBe(EMPTY_RESULT);
		});

		it('a middleware can prevent calling other middlewares by not calling next function', async () => {
			const m1 = sinon.stub().yields();
			const m2 = sinon.stub().returns(EMPTY_RESULT);
			const m3 = sinon.stub();
			const engine = new Engine()
				.use(m1)
				.use(m2)
				.use(m3);

			const result = await engine.find(EMPTY_QUERY);

			sinon.assert.callOrder(m1, m2);
			sinon.assert.notCalled(m3);

			expect(result)
				.toBe(EMPTY_RESULT);
		});
	});

	it('query runner is a mapper to `find`', async () => {
		const engine = new Engine<any, Query>();
		engine.find = sinon.stub();
		const queryRunner = engine.asQueryRunner()

		await queryRunner(EMPTY_QUERY);
	});
});

