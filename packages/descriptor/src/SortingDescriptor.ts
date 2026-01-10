import { SortableFieldDefinition } from "@pallad/query";

export interface SortingDescriptorSingle<TSortableField extends string> {
	type: "SINGLE";
	sortableFields: readonly [TSortableField, ...TSortableField[]];
	defaultSorting: SortableFieldDefinition<TSortableField>;
}

export interface SortingDescriptorMulti<TSortableField extends string> {
	type: "MULTI";
	sortableFields: readonly [TSortableField, ...TSortableField[]];
	defaultSorting: Array<SortableFieldDefinition<TSortableField>>;
}

export type SortingDescriptor<TSortableField extends string> =
	| SortingDescriptorSingle<TSortableField>
	| SortingDescriptorMulti<TSortableField>;
