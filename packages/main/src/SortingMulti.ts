import { SortingFieldDefinition } from "./SortingFieldDefinition";

export interface SortingMulti<TField extends string> {
    sortBy: Array<SortingFieldDefinition<TField>>;
}

export namespace SortingMulti {
    export type Input<TField extends string> = Partial<SortingMulti<TField>>;
    export interface ResultMeta<TField extends string> {
        sortBy: Array<SortingFieldDefinition<TField>>;
    }
}
