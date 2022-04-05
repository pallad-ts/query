import {Result} from "./Result";

export type QueryRunner<TQuery, TResult extends Result<any>> = (query: TQuery) => Promise<TResult> | TResult;

