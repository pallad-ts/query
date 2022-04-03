import {SortDirection} from "./SortDirection";

export interface SortableFieldDefinition<TField extends string> {
    field: TField;
    direction: SortDirection;
}
