export interface PageInfoFactory<TInput, TOutput> {
	compute(query: TInput): TOutput;
}
