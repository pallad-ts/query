export interface Result<TResult> {
    results: TResult[]
}

export namespace Result {
    export type InferEntity<T extends Result<any>> = T extends Result<infer TResult> ? TResult : never;
}
