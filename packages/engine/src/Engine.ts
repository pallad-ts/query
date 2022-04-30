import {Query, QueryRunner, Result} from '@pallad/query';
import {ERRORS} from "./errors";

export class Engine<TQuery extends Query<any> = Query<unknown>,
	TContext extends object = object,
	TFinalResult extends Result<any> = Result<unknown>> {
	private middlewares: Array<Engine.MiddlewareType<any, any>> = [];
	private contextFactory?: Engine.ContextFactory<TQuery>;

	readonly result!: TFinalResult;
	readonly query!: TQuery;

	useContextFactory<T extends Engine.ContextFactory<any>>(contextFactory: T)
		: Engine<Parameters<T>[0] extends never | undefined ? TQuery : Parameters<T>[0],
		Awaited<ReturnType<T>>,
		TFinalResult> {
		this.contextFactory = contextFactory;
		// @ts-ignore
		return this;
	}

	useResultFactory<T extends Engine.ResultFactory<TContext & Engine.BaseContext<TQuery>, any>>(resultFactory: T): Engine<TQuery, TContext, Awaited<ReturnType<T>>> {
		this.middlewares.unshift(resultFactory);
		// @ts-ignore
		return this;
	}

	use(...middlewares: Array<Engine.MiddlewareType<Engine.FullContext<TContext, TQuery>, TFinalResult>>): this {
		this.middlewares = this.middlewares.concat(middlewares);
		return this;
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	async find(query: TQuery): Promise<TFinalResult> {
		const baseContext = this.contextFactory ? this.contextFactory(query) : {};
		const context = {...baseContext, query} as TContext & Engine.BaseContext<TQuery>;

		const middlewares = this.middlewares.slice();
		if (middlewares.length === 0) {
			throw ERRORS.NO_MIDDLEWARES();
		}

		let currentMiddleware = 0;
		const next = (context: TContext & Engine.BaseContext<TQuery>) => {
			const middleware = middlewares[currentMiddleware];
			currentMiddleware++;
			if (middleware) {
				// @ts-ignore
				return middleware.call(this, context, next) as any;
			}
			throw ERRORS.NO_FURTHER_MIDDLEWARE();
		};

		return next(context);
	}

	asQueryRunner(): QueryRunner<TQuery, TFinalResult> {
		return this.find.bind(this);
	}
}

export namespace Engine {
	export type MiddlewareType<TContext extends BaseContext<any>,
		TResult extends Result<any>> = Middleware<TContext, NextFunction<TContext, TResult>>;

	export interface BaseContext<TQuery> {
		query: TQuery
	}

	export type FullContext<TContext, TQuery> = TContext & BaseContext<TQuery>;

	export type Middleware<TContext extends BaseContext<any>, TNextFunction extends NextFunction<any, any>> = (context: TContext, next: TNextFunction) => unknown;

	export type NextFunction<TContext extends BaseContext<any>, TResult extends Result<any>> = (context: TContext) => Promise<TResult> | TResult;

	export type ContextFactory<TQuery extends Query<any>> = (query: TQuery) => any;

	export type ResultFactory<TContext, TFinalResult extends Result<any>> = (context: TContext) => (Promise<TFinalResult> | TFinalResult)
}

