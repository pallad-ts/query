import {Query, QueryRunner, Result} from '@pallad/query';
import {ERRORS} from "./errors";

export class Engine<TResult, TQuery extends Query<any> = Query<unknown>, TContext extends object = object> {
	private middlewares: Array<Engine.MiddlewareType<TResult, TQuery, TContext>> = [];
	private contextFactory?: Engine.ContextFactory<TQuery, TContext>;

	useContextFactory<T extends Engine.ContextFactory<any, any>>(contextFactory: T)
		: Engine<TResult,
		Parameters<T>[0] extends never | undefined ? TQuery : Parameters<T>[0],
		Awaited<ReturnType<T>>> {
		this.contextFactory = contextFactory;
		// @ts-ignore
		return this;
	}

	use(...middlewares: Array<Engine.MiddlewareType<TResult, TQuery, TContext>>): this {
		this.middlewares = this.middlewares.concat(middlewares);
		return this;
	}

	async find(query: TQuery): Promise<Result<TResult>> {

		const baseContext = this.contextFactory ? this.contextFactory(query) : {};
		const context = {...baseContext, query} as TContext & Engine.BaseContext<TQuery>;

		const middlewares = this.middlewares.slice();
		if (middlewares.length === 0) {
			throw ERRORS.NO_MIDDLEWARES();
		}

		let currentMiddleware = 0;
		const next: Engine.NextFunction<TContext & Engine.BaseContext<TQuery>, Result<TResult>> = (context: TContext & Engine.BaseContext<TQuery>) => {
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

	asQueryRunner(): QueryRunner<TQuery, Result<TResult>> {
		return this.find.bind(this);
	}
}

export namespace Engine {
	export type MiddlewareType<TResult,
		TQuery extends Query<unknown>,
		TContext> = Middleware<TContext & BaseContext<TQuery>,
		NextFunction<TContext & BaseContext<TQuery>,
			Result<TResult>>>;

	export interface BaseContext<TQuery> {
		query: TQuery
	}

	export type Middleware<TContext extends BaseContext<any>, TNextFunction extends NextFunction<any, any>> = (context: TContext, next: TNextFunction) => unknown;

	export type NextFunction<TContext extends BaseContext<any>, TResult extends Result<any>> = (context: TContext) => Promise<TResult> | TResult;

	export type ContextFactory<TQuery extends Query<any>, TResult extends object> = (query: TQuery) => Promise<TResult> | TResult;
}

