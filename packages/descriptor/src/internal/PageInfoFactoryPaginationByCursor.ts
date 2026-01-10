import { PageInfoFactory } from "./PageInfoFactory";
import { PaginationByCursor } from "@pallad/query/src";
import { CursorEncoder } from "@pallad/cursor-encoder";
export class PageInfoFactoryPaginationByCursor
	implements PageInfoFactory<PaginationByCursor, PaginationByCursor.PageInfo>
{
	constructor(encoder: CursorEncoder) {}

	compute(query: PaginationByCursor & Sort, result: unknown[]): PaginationByCursor.PageInfo {
		return {};
	}
}
