module.exports = {
	entrypoints: ["index.ts"],
	entrypointOutputMode: "cjs",
	typescript: {
		tsConfigReferenceTargetPath: "tsconfig.build.json",
		referenceTsConfigPaths: ["tsconfig.json", "tsconfig.build.json"],
	},
};
