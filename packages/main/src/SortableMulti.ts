import { SortableFieldDefinition } from "./SortableFieldDefinition";

export interface SortableMulti<TField extends string> {
    sortBy: Array<SortableFieldDefinition<TField>>;
}

export namespace SortableMulti {
    export interface ResultMeta<TField extends string> {
        sortBy: Array<SortableFieldDefinition<TField>>;
    }
}
