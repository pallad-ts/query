import {Domain, generators} from "alpha-errors";

export const ERRORS = Domain.create({
	codeGenerator: generators.formatCode('E_QUERY_ENGINE_%d'),
})
	.createErrors(create => {
		return {
			NO_MIDDLEWARES: create('Could not find any results in query engine due to lack of middlewares'),
			NO_FURTHER_MIDDLEWARE: create('No further middleware to call')
		}
	})
