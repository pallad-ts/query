import {Domain, generators} from "alpha-errors";

export const Errors = Domain.create({
    codeGenerator: generators.formatCode('E_QUERY_%d')
})
    .createErrors(create => ({
        INVALID_SORT_DIRECTION: create('Invalid sort direction: %s')
    }))
