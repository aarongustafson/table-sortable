import { beforeAll } from 'vitest';
import { TableSortableElement } from '../table-sortable.js';

// Define the custom element before tests run
beforeAll(() => {
	if (!customElements.get('table-sortable')) {
		customElements.define('table-sortable', TableSortableElement);
	}

	// Make the class available globally for testing static methods
	globalThis.TableSortableElement = TableSortableElement;
});
