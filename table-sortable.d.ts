export type TableSortableDirection = 'asc' | 'desc';

export interface TableSortableSortDetail {
	column: number;
	direction: TableSortableDirection;
	header: HTMLElement;
}

export type TableSortableSortEvent = CustomEvent<TableSortableSortDetail>;

export declare class TableSortableElement extends HTMLElement {
	labelSortable: string | null;
	labelAscending: string | null;
	labelDescending: string | null;
}

export declare function defineTableSortable(tagName?: string): boolean;

declare global {
	interface HTMLElementTagNameMap {
		'table-sortable': TableSortableElement;
	}

	interface GlobalEventHandlersEventMap {
		'table-sortable:sort': TableSortableSortEvent;
	}
}

export {};
