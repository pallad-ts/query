# @pallad/query

`@pallad/query` provides shared TypeScript contracts for query objects, pagination results, sorting, and query runners.

It does not execute queries or validate input. Use it as the core type package. Runtime validation and query/result creation live in packages such as `@pallad/query-descriptor`.

## Query

`Query<TFilter>` is the base query shape:

```ts
import { Query } from "@pallad/query";

type UserQuery = Query<{
	status?: "active" | "archived";
}>;
```

Every query has a `filter` field. Pagination and sorting types can be added through intersections.

## Pagination

Offset pagination uses `offset` and `limit`:

```ts
import { PaginationByOffset } from "@pallad/query";

type OffsetQuery = PaginationByOffset;

const result: PaginationByOffset.Result<User> = {
	list: users,
	pageInfo: {
		offset: 0,
		limit: 20,
		hasNextPage: true,
		hasPreviousPage: false,
	},
};
```

Cursor pagination uses optional `before`/`after` cursors and `limit`:

```ts
import { PaginationByCursor } from "@pallad/query";

const result: PaginationByCursor.Result<User> = {
	edges: users.map(user => ({
		node: user,
		cursor: { i: user.id },
	})),
	nodes: users,
	pageInfo: {
		limit: 20,
		hasNextPage: false,
		hasPreviousPage: false,
	},
};
```

When no pagination is used, return `NoPagination.Result<T>`:

```ts
import { NoPagination } from "@pallad/query";

const result: NoPagination.Result<User> = {
	list: users,
};
```

## Sorting

Sorting is described with `SortingFieldDefinition<TField>` and `SortDirection`:

```ts
import { SortingSingle, SortingMulti } from "@pallad/query";

type UserSortField = "name" | "createdAt";

type SingleSort = SortingSingle<UserSortField>;
type MultiSort = SortingMulti<UserSortField>;
```

Single sorting stores one `sortBy` field. Multi sorting stores a `sortBy` array.

```ts
const single: SingleSort = {
	sortBy: { field: "name", direction: "ASC" },
};

const multi: MultiSort = {
	sortBy: [
		{ field: "createdAt", direction: "DESC" },
		{ field: "name", direction: "ASC" },
	],
};
```

## Query Runner

`QueryRunner<TQuery, TResult>` describes a function that accepts a query and returns a paginated result, synchronously or asynchronously:

```ts
import { PaginationByOffset, Query, QueryRunner } from "@pallad/query";

type UserQuery = Query<{ status?: string }> & PaginationByOffset;

const runUsersQuery: QueryRunner<UserQuery, PaginationByOffset.Result<User>> = async query => {
	return {
		list: [],
		pageInfo: {
			offset: query.offset ?? 0,
			limit: query.limit,
			hasNextPage: false,
			hasPreviousPage: false,
		},
	};
};
```

## Utility Types

`SetResultType<TEntity, TResult>` replaces entity type in a known result shape:

```ts
import { PaginationByCursor, SetResultType } from "@pallad/query";

type UserCursorResult = SetResultType<User, PaginationByCursor.Result<unknown>>;
```
