# @pallad/query-descriptor

`@pallad/query-descriptor` builds typed, runtime-validated query contracts for `@pallad/query`.

The main entry point is `QueryDescriptor`. It combines optional filter validation, pagination configuration, and sorting configuration into one Zod schema. The same descriptor can then parse incoming query input and create response metadata for result lists.

## QueryDescriptor

`QueryDescriptor` is a builder for query objects. It supports:

- `filterSchema(schema)` - adds a Zod object schema under `filter`.
- `paginationByOffset(options?)` - adds `offset` and `limit` pagination.
- `paginationByCursor(options?)` - adds `before`, `after`, and `limit` cursor pagination.
- `sortingBySingleField(config)` - allows one sortable field.
- `sortingByMultipleFields(config)` - allows a non-empty list of sortable fields.
- `createQuery(input)` - parses input through the generated Zod schema.
- `createResult(query, entityList, paginationContext?)` - creates response data with list/page/sort metadata.

Each builder method updates TypeScript input, output, pagination, and sorting types. `querySchema` is generated lazily and cached until descriptor configuration changes.

## Example

```ts
import { QueryDescriptor } from "@pallad/query-descriptor";
import { z } from "zod";

const descriptor = new QueryDescriptor()
	.filterSchema(
		z.object({
			status: z.enum(["active", "archived"]).optional(),
		})
	)
	.paginationByOffset({ defaultLimit: 20 })
	.sortingByMultipleFields({
		sortableFields: ["name", "createdAt"],
		defaultSorting: [{ field: "createdAt", direction: "DESC" }],
	});

const query = descriptor.createQuery({
	filter: { status: "active" },
	offset: 0,
	sortBy: [{ field: "name", direction: "ASC" }],
});

const result = descriptor.createResult(query, [{ id: "user-1", name: "Ada" }], {
	hasNextPage: false,
	hasPreviousPage: false,
});
```

`query` contains parsed filter, pagination defaults, and validated sorting. `result` contains the entity list, pagination `pageInfo`, and `sortBy` metadata.

## Pagination

Offset pagination produces input with `offset` and `limit`, and result metadata under `pageInfo`:

```ts
{
	list: entities,
	pageInfo: {
		offset,
		limit,
		hasNextPage,
		hasPreviousPage,
	},
}
```

Cursor pagination produces input with optional `before`/`after` cursors and `limit`. Result data follows the connection shape:

```ts
{
	edges: [{ node, cursor }],
	nodes: entities,
	pageInfo: {
		limit,
		startCursor,
		endCursor,
		hasNextPage,
		hasPreviousPage,
	},
}
```

Cursor pagination requires single-field sorting and rejects multi-field sorting. Cursors use entity `id` by default; pass `idExtractor` in `createResult` context when entities do not expose a string `id` field.

## Sorting

Single-field sorting validates one `sortBy` object:

```ts
{ sortBy: { field: "name", direction: "ASC" } }
```

Multi-field sorting validates a non-empty `sortBy` array and applies configured default sorting when `sortBy` is missing.

Both sorting modes add `sortBy` metadata to results through `createResult`.
