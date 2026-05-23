# @pallad/query-graphql

`@pallad/query-graphql` creates GraphQL input and result types for descriptors from `@pallad/query-descriptor`.

Use it when GraphQL should expose the same filter, pagination, and sorting rules that your query descriptor validates at runtime.

## Installation

```sh
yarn add @pallad/query-graphql @pallad/query-descriptor graphql
```

`graphql` is a peer dependency.

## GraphQLQueryBuilder

`GraphQLQueryBuilder` is the main entry point. It creates:

- `${baseName}_Query` input type for filter, pagination, and sorting.
- `${baseName}_Result` object type for list/connection results.
- Resolver wrapper that parses GraphQL args through the descriptor before calling your executor.

```ts
import { QueryDescriptor } from "@pallad/query-descriptor";
import { GraphQLQueryBuilder } from "@pallad/query-graphql";
import { GraphQLInputObjectType, GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql";
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

const userFilterType = new GraphQLInputObjectType({
	name: "User_Filter",
	fields: {
		status: { type: GraphQLString },
	},
});

const userType = new GraphQLObjectType({
	name: "User",
	fields: {
		id: { type: new GraphQLNonNull(GraphQLString) },
		name: { type: new GraphQLNonNull(GraphQLString) },
		createdAt: { type: new GraphQLNonNull(GraphQLString) },
	},
});

const usersQuery = new GraphQLQueryBuilder({
	baseName: "Users",
	descriptor,
	filterType: userFilterType,
	entityType: userType,
});
```

## Adding Field To Schema

`getField()` returns a `GraphQLFieldConfig`. Its `execute` callback receives a parsed query, source, context, and GraphQL resolve info.

```ts
import { GraphQLObjectType, GraphQLSchema } from "graphql";

const schema = new GraphQLSchema({
	query: new GraphQLObjectType({
		name: "Query",
		fields: {
			users: usersQuery.getField({
				execute: async query => {
					const list = await loadUsers(query);

					return {
						list,
						pagination: {
							hasNextPage: false,
							hasPreviousPage: false,
						},
					};
				},
			}),
		},
	}),
});
```

`execute` returns raw entities and pagination context. `GraphQLQueryBuilder` calls `descriptor.createResult(query, list, pagination)` and returns the GraphQL-ready result.

## Offset Pagination Example

Descriptor:

```ts
const descriptor = new QueryDescriptor().paginationByOffset();
```

Generated result type:

```graphql
type Users_Result {
  list: [User!]!
  pageInfo: PageInfo_ByOffset!
}
```

Query:

```graphql
query {
  users(query: {limit: 20, offset: 40}) {
    list {
      id
      name
    }
    pageInfo {
      limit
      offset
      hasNextPage
      hasPreviousPage
    }
  }
}
```

## Cursor Pagination Example

Descriptor:

```ts
const descriptor = new QueryDescriptor()
	.paginationByCursor()
	.sortingBySingleField({
		fields: ["name", "createdAt"],
		default: { field: "createdAt", direction: "DESC" },
	});
```

Generated result type:

```graphql
type Users_Result {
  edges: [Users_Edge!]!
  nodes: [User!]!
  pageInfo: PageInfo_ByCursor!
  sortBy: Users_Result_Sort!
}

type Users_Edge {
  node: User!
  cursor: Cursor!
}
```

Query:

```graphql
query {
  users(query: {limit: 20, sortBy: {field: createdAt, direction: DESC}}) {
    edges {
      node {
        id
        name
      }
      cursor
    }
    nodes {
      id
    }
    pageInfo {
      limit
      startCursor
      endCursor
      hasNextPage
      hasPreviousPage
    }
    sortBy {
      field
      direction
    }
  }
}
```

Cursor pagination returns both `edges` and `nodes`. Cursors are built by `@pallad/query-descriptor` from entity ids by default.

## Sorting

Sorting fields become a GraphQL enum named `${baseName}_Sort_Field`. Field names are camel-cased for GraphQL, while enum values keep original descriptor field names.

```ts
const descriptor = new QueryDescriptor().sortingByMultipleFields({
	sortableFields: ["created_at", "name"],
	defaultSorting: [{ field: "created_at", direction: "DESC" }],
});
```

```graphql
enum Users_Sort_Field {
  createdAt
  name
}
```

Single sorting uses one input object:

```graphql
query {
  users(query: {sortBy: {field: name, direction: ASC}}) {
    list { id }
  }
}
```

Multiple sorting uses a list:

```graphql
query {
  users(query: {sortBy: [{field: createdAt, direction: DESC}, {field: name, direction: ASC}]}) {
    list { id }
  }
}
```

## Low-Level Helpers

The package also exports helpers used by `GraphQLQueryBuilder`:

- `createQueryType()` - creates `${baseName}_Query` input type.
- `createSortFieldType()` - creates `${baseName}_Sort_Field` enum.
- `createInputSortType()` - creates GraphQL sort input object or list.
- `createResultSortType()` - creates GraphQL sort result object or list.
- `getQueryFieldsForPaginationByOffset()` - creates `limit` and `offset` input fields.
- `getQueryFieldsForPaginationByCursor()` - creates `after`, `before`, and `limit` input fields.
- `GraphQLPageInfoPaginationByOffset` - shared offset `pageInfo` type.
- `GraphQLPageInfoPaginationByCursor` - shared cursor `pageInfo` type.

Use low-level helpers when you need custom schema composition. For common query fields, prefer `GraphQLQueryBuilder`.
