"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLSortDirection = void 0;
var graphql_1 = require("graphql");
exports.GraphQLSortDirection = new graphql_1.GraphQLEnumType({
    name: "SortDirection",
    values: {
        ASC: {
            value: "ASC",
        },
        DESC: {
            value: "DESC",
        },
    },
});
