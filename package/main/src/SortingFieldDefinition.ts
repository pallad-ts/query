import { SortDirection } from "./SortDirection";

export interface SortingFieldDefinition<TField extends string> {
    field: TField;
    direction: SortDirection;
}
