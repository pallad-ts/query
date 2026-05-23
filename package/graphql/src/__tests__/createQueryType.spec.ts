import { GraphQLInputObjectType, GraphQLNonNull, GraphQLString, printType } from "graphql";

import { createInputSortType } from "../createInputSortType";
import { createQueryType } from "../createQueryType";
import { createSortFieldType } from "../createSortFieldType";
import { SORTABLE_FIELDS } from "./fixtures";

describe("createQueryType", () => {
	const filterType = new GraphQLInputObjectType({
		name: "Base_Filter",
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
				filterType,
			},
		],
		[
			"with sort type",
			{
				filterType,
				sortType,
			},
		],
		[
			"with pagination fields",
			{
				filterType,
				fields: {
					limit: { type: GraphQLString },
				},
			},
		],
		[
			"with all options",
			{
				filterType,
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
