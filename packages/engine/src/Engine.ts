import {Query, Result} from '@pallad/query';

export class Engine<TResult, TQuery extends Query<any>, TContext extends Engine.Context<TQuery> = any> {
	private middlewares: Array<Engine.MiddlewareType<TResult, TQuery, TContext>> = [];

	constructor(private contextFactory: Engine.ContextFactory<TQuery>) {

	}

	static create<TResult, TQuery extends Query<any>, TContextFactory extends Engine.ContextFactory<TQuery>>(factory: TContextFactory) {
		return new Engine<TResult, TQuery, Awaited<ReturnType<TContextFactory>>>(factory);
	}

	use(...middlewares: Array<Engine.MiddlewareType<TResult, TQuery, TContext>>): this {
		this.middlewares = this.middlewares.concat(middlewares);
		return this;
	}

	async find(query: TQuery): Promise<Result<TResult>> {
		const context = await this.contextFactory(query) as TContext;

		const middlewares = this.middlewares.slice();
		if (middlewares.length === 0) {
			throw new Error('Could not find any results in query engine due to lack of middlewares');
		}

		let currentMiddleware = 0;
		const next: Engine.NextFunction<TContext, Result<TResult>> = (context: TContext) => {
			const middleware = middlewares[currentMiddleware];
			currentMiddleware++;
			if (middleware) {
				// @ts-ignore
				return middleware.call(this, context, next);
			}
			throw new Error('No further middleware to call');
		};

		return next(context);
	}
}

export namespace Engine {
	export type MiddlewareType<TResult, TQuery extends Query<any>, TContext = any> = Middleware<Context<TQuery>,
		NextFunction<Context<TQuery>, Result<TResult>>>;

	export interface Context<TQuery extends Query<any>> {
		query: TQuery
	}

	export type Middleware<TContext, TNextFunction extends NextFunction<any, any>> = (context: TContext, next: TNextFunction) => ReturnType<TNextFunction>;

	export type NextFunction<TContext extends Context<any>, TResult extends Result<any>> = (context: TContext) => Promise<TResult> | TResult;

	export type ContextFactory<TQuery extends Query<any>> = (query: TQuery) => Promise<Context<TQuery>> | Context<TQuery>;
}
