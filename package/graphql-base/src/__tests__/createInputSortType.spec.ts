import { getNamedType, GraphQLInputObjectType, printType } from "graphql";

import { createInputSortType } from "../createInputSortType";
import { createSortFieldType } from "../createSortFieldType";
import { SORTABLE_FIELDS } from "./fixtures";

describe("createInputSortType", () => {
	const sortFieldType = createSortFieldType("Base", SORTABLE_FIELDS);

	it.each<[{ isMulti: boolean }]>([[{ isMulti: true }], [{ isMulti: false }]])(
		"creates input sort type",
		opts => {
			const type = createInputSortType({
				baseName: "Base",
				sortFieldType,
				...opts,
			});

			expect(printType(getNamedType(type))).toMatchSnapshot();

			expect(
				printType(
					new GraphQLInputObjectType({
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
