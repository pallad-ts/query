import {SortableFieldDefinition} from "./SortableFieldDefinition";

export interface SortableSingle<TField extends string> {
    sortBy: SortableFieldDefinition<TField>;
}
