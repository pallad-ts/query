import { Domain, formatCodeFactory, ErrorDescriptor } from "@pallad/errors";

const code = formatCodeFactory("E_QUERY_ENGINE_%c");
export const errorsDomain = new Domain();
export const ERRORS = errorsDomain.addErrorsDescriptorsMap({
	NO_MIDDLEWARES: ErrorDescriptor.useDefaultMessage(
		code(1),
		"Could not find any results in query engine due to lack of middlewares"
	),
	NO_FURTHER_MIDDLEWARE: ErrorDescriptor.useDefaultMessage(
		code(2),
		"No further middleware to call"
	),
});
