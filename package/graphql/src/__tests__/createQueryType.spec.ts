import { GraphQLInputObjectType, GraphQLNonNull, GraphQLString, printType } from "graphql";

import { createInputSortType } from "../createInputSortType";
import { createQueryType } from "../createQueryType";
import { createSortFieldType } from "../createSortFieldType";
import { SORTABLE_FIELDS } from "./fixtures";

describe("createQueryType", () => {
	const filtersType = new GraphQLInputObjectType({
		name: "Base_Filters",
		fields: {
			name: { type: new GraphQLNonNull(GraphQLString) },
		},
	});

	const sortType = createInputSortType({
		baseName: "Base",
		sortFieldType: createSortFieldType("Base", SORTABLE_FIELDS),
		isMulti: false,
	});

	it.each<[string, Omit<createQueryType.Options, "baseName">]>([
		[
			"simple",
			{
				filtersType,
			},
		],
		[
			"with sort type",
			{
				filtersType,
				sortType,
			},
		],
		[
			"with pagination fields",
			{
				filtersType,
				fields: {
					limit: { type: GraphQLString },
				},
			},
		],
		[
			"with all options",
			{
				filtersType,
				sortType,
				fields: {
					limit: { type: GraphQLString },
				},
			},
		],
	])("creates query input type: %s", (caseName, opts) => {
		void caseName;
		expect(
			printType(
				createQueryType({
					baseName: "Base",
					...opts,
				})
			)
		).toMatchSnapshot();
	});
});
