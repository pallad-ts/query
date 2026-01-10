import { SortableFieldDefinition } from "./SortableFieldDefinition";

export interface SortingSingle<TField extends string> {
    sortBy: SortableFieldDefinition<TField>;
}

export namespace SortingSingle {
    export type Input<TField extends string> = Partial<SortingSingle<TField>>;
    export interface ResultMeta<TField extends string> {
        sortBy: SortableFieldDefinition<TField>;
    }
}
