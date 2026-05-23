import { getNamedType, GraphQLObjectType, printType } from "graphql";

import { createResultSortType } from "../createResultSortType";
import { createSortFieldType } from "../createSortFieldType";
import { SORTABLE_FIELDS } from "./fixtures";

describe("createResultSortType", () => {
	const sortFieldType = createSortFieldType("Base", SORTABLE_FIELDS);

	it.each<[{ isMulti: boolean }]>([[{ isMulti: true }], [{ isMulti: false }]])(
		"creates object type: %s",
		opts => {
			const type = createResultSortType({
				baseName: "Base",
				sortFieldType,
				...opts,
			});

			expect(printType(getNamedType(type) as GraphQLObjectType)).toMatchSnapshot();

			expect(
				printType(
					new GraphQLObjectType({
						name: "Base",
						fields: {
							sortBy: {
								type,
							},
						},
					})
				)
			).toMatchSnapshot();
		}
	);
});
