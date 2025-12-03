import { describe, it, expect, beforeEach } from 'vitest';
import { TableSortableElement } from '../table-sortable.js';

describe('TableSortableElement', () => {
	let element;

	beforeEach(() => {
		element = document.createElement('table-sortable');
		document.body.appendChild(element);
	});

	it('should be defined', () => {
		expect(customElements.get('table-sortable')).toBe(TableSortableElement);
	});

	it('should create an instance', () => {
		expect(element).toBeInstanceOf(TableSortableElement);
		expect(element).toBeInstanceOf(HTMLElement);
	});

	it('should have a shadow root', () => {
		expect(element.shadowRoot).toBeTruthy();
	});

	// Add more tests here
});
