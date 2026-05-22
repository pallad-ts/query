import baseConfig from "../../vitest.base.config.js";

export default {
	...baseConfig,
	resolve: {
		alias: {
			graphql: "graphql/index.js",
		},
	},
};
