import { SortableFieldDefinition } from "./SortableFieldDefinition";

export interface SortableSingle<TField extends string> {
    sortBy: SortableFieldDefinition<TField>;
}

export namespace SortableSingle {
    export interface ResultMeta<TField extends string> {
        sortBy: SortableFieldDefinition<TField>;
    }
}
