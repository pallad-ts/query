import {SortableFieldDefinition} from "./SortableFieldDefinition";

export interface SortableMulti<TField extends string> {
    sortBy: Array<SortableFieldDefinition<TField>>;
}
