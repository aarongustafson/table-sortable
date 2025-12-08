import { TableSortableElement } from './table-sortable.js';

export function defineTableSortable(tagName = 'table-sortable') {
	const hasWindow = typeof window !== 'undefined';
	const registry = hasWindow ? window.customElements : undefined;

	if (!registry || typeof registry.define !== 'function') {
		return false;
	}

	if (!registry.get(tagName)) {
		registry.define(tagName, TableSortableElement);
	}

	return true;
}

defineTableSortable();
