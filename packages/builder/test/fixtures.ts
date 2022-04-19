export interface Filters {
	foo: 'foo',
	bar: 'bar'
}

export const SORTABLE_FIELDS = ['foo', 'bar'] as const;
export const DEFAULT_SORTING = {field: 'foo', direction: 'ASC'} as const;
