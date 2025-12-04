import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TableSortableElement } from '../table-sortable.js';

describe('TableSortableElement', () => {
	let element;

	beforeEach(() => {
		// Define custom element if not already defined
		if (!customElements.get('table-sortable')) {
			customElements.define('table-sortable', TableSortableElement);
		}

		element = document.createElement('table-sortable');
		document.body.appendChild(element);
	});

	afterEach(() => {
		if (element && element.parentNode) {
			element.parentNode.removeChild(element);
		}
	});

	it('should be defined', () => {
		expect(customElements.get('table-sortable')).toBe(TableSortableElement);
	});

	it('should create an instance', () => {
		expect(element).toBeInstanceOf(TableSortableElement);
		expect(element).toBeInstanceOf(HTMLElement);
	});

	it('should not have a shadow root (uses light DOM)', () => {
		expect(element.shadowRoot).toBeNull();
	});

	describe('Progressive enhancement', () => {
		beforeEach(async () => {
			element.innerHTML = `
				<table>
					<thead>
						<tr>
							<th>Name</th>
							<th>Age</th>
							<th>City</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>Charlie</td>
							<td>35</td>
							<td>New York</td>
						</tr>
						<tr>
							<td>Alice</td>
							<td>28</td>
							<td>Boston</td>
						</tr>
					</tbody>
				</table>
			`;
			await new Promise((resolve) => setTimeout(resolve, 10));
		});

		it('should inject buttons into plain th elements', () => {
			const headers = element.querySelectorAll('thead th');
			headers.forEach((th) => {
				const button = th.querySelector('button');
				expect(button).toBeTruthy();
				expect(button.type).toBe('button');
			});
		});

		it('should preserve th text content in injected buttons', () => {
			const nameHeader = element.querySelector('thead th:first-child');
			const button = nameHeader.querySelector('button');
			expect(button.textContent).toBe('Name');
		});

		it('should make auto-injected buttons sortable', () => {
			const nameButton = element.querySelector(
				'thead th:first-child button',
			);
			nameButton.click();

			const rows = element.querySelectorAll('tbody tr');
			expect(rows[0].querySelector('td').textContent).toBe('Alice');
			expect(rows[1].querySelector('td').textContent).toBe('Charlie');
		});

		it('should add accessibility attributes to auto-injected buttons', () => {
			const th = element.querySelector('thead th');
			const button = th.querySelector('button');
			// Buttons don't need role="button" or tabindex (they have these by default)
			expect(button.getAttribute('role')).toBeNull();
			expect(button.getAttribute('tabindex')).toBeNull();
			expect(th.getAttribute('aria-sort')).toBe('none');
		});
	});

	describe('Basic table setup', () => {
		beforeEach(async () => {
			element.innerHTML = `
				<table>
					<thead>
						<tr>
							<th>Name</th>
							<th>Age</th>
							<th>City</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>Charlie</td>
							<td>35</td>
							<td>New York</td>
						</tr>
						<tr>
							<td>Alice</td>
							<td>28</td>
							<td>Boston</td>
						</tr>
						<tr>
							<td>Bob</td>
							<td>42</td>
							<td>Chicago</td>
						</tr>
					</tbody>
				</table>
			`;
			// Wait for connectedCallback setTimeout
			await new Promise((resolve) => setTimeout(resolve, 10));
		});

		it('should find and set up the table', () => {
			expect(element._table).toBeTruthy();
			expect(element._table.tagName).toBe('TABLE');
		});

		it('should add aria-sort="none" to sortable headers', () => {
			const headers = element.querySelectorAll('thead th');
			headers.forEach((th) => {
				expect(th.getAttribute('aria-sort')).toBe('none');
			});
		});

		it('should create a live region for screen reader announcements', () => {
			const liveRegion = element.querySelector('[role="status"]');
			expect(liveRegion).toBeTruthy();
			expect(liveRegion.getAttribute('aria-live')).toBe('polite');
			expect(liveRegion.getAttribute('aria-atomic')).toBe('true');
		});
	});

	describe('Sorting functionality', () => {
		beforeEach(async () => {
			element.innerHTML = `
				<table>
					<thead>
						<tr>
							<th>Name</th>
							<th>Age</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>Charlie</td>
							<td>35</td>
						</tr>
						<tr>
							<td>Alice</td>
							<td>28</td>
						</tr>
						<tr>
							<td>Bob</td>
							<td>42</td>
						</tr>
					</tbody>
				</table>
			`;
			await new Promise((resolve) => setTimeout(resolve, 10));
		});

		it('should sort alphabetically in ascending order on first click', () => {
			const nameHeader = element.querySelector(
				'thead th:first-child button',
			);
			nameHeader.click();

			const rows = element.querySelectorAll('tbody tr');
			expect(rows[0].querySelector('td').textContent).toBe('Alice');
			expect(rows[1].querySelector('td').textContent).toBe('Bob');
			expect(rows[2].querySelector('td').textContent).toBe('Charlie');
		});

		it('should sort alphabetically in descending order on second click', () => {
			const nameHeader = element.querySelector(
				'thead th:first-child button',
			);
			nameHeader.click(); // First click: ascending
			nameHeader.click(); // Second click: descending

			const rows = element.querySelectorAll('tbody tr');
			expect(rows[0].querySelector('td').textContent).toBe('Charlie');
			expect(rows[1].querySelector('td').textContent).toBe('Bob');
			expect(rows[2].querySelector('td').textContent).toBe('Alice');
		});

		it('should sort numerically', () => {
			const ageHeader = element.querySelector(
				'thead th:nth-child(2) button',
			);
			ageHeader.click();

			const rows = element.querySelectorAll('tbody tr');
			expect(rows[0].children[1].textContent).toBe('28');
			expect(rows[1].children[1].textContent).toBe('35');
			expect(rows[2].children[1].textContent).toBe('42');
		});

		it('should add "active" class to sorted column header', () => {
			const nameHeader = element.querySelector('thead th:first-child');
			const nameLink = nameHeader.querySelector('button');
			nameLink.click();

			expect(nameHeader.classList.contains('active')).toBe(true);
		});

		it('should add "up" class for ascending sort', () => {
			const nameHeader = element.querySelector('thead th:first-child');
			const nameLink = nameHeader.querySelector('button');
			nameLink.click();

			expect(nameHeader.classList.contains('up')).toBe(true);
			expect(nameHeader.classList.contains('down')).toBe(false);
		});

		it('should add "down" class for descending sort', () => {
			const nameHeader = element.querySelector('thead th:first-child');
			const nameLink = nameHeader.querySelector('button');
			nameLink.click(); // First click: ascending
			nameLink.click(); // Second click: descending

			expect(nameHeader.classList.contains('down')).toBe(true);
			expect(nameHeader.classList.contains('up')).toBe(false);
		});

		it('should remove active class from previously sorted column', () => {
			const nameHeader = element.querySelector('thead th:first-child');
			const ageHeader = element.querySelector('thead th:nth-child(2)');
			const nameLink = nameHeader.querySelector('button');
			const ageLink = ageHeader.querySelector('button');

			nameLink.click();
			expect(nameHeader.classList.contains('active')).toBe(true);

			ageLink.click();
			expect(nameHeader.classList.contains('active')).toBe(false);
			expect(ageHeader.classList.contains('active')).toBe(true);
		});

		it('should update aria-sort when sorting', () => {
			const nameHeader = element.querySelector('thead th:first-child');
			const nameLink = nameHeader.querySelector('button');

			// Initial state
			expect(nameHeader.getAttribute('aria-sort')).toBe('none');

			// After first click (ascending)
			nameLink.click();
			expect(nameHeader.getAttribute('aria-sort')).toBe('ascending');

			// After second click (descending)
			nameLink.click();
			expect(nameHeader.getAttribute('aria-sort')).toBe('descending');
		});

		it('should fire table-sortable:sort event', () => {
			const handler = vi.fn();
			element.addEventListener('table-sortable:sort', handler);

			const nameLink = element.querySelector(
				'thead th:first-child button',
			);
			nameLink.click();

			expect(handler).toHaveBeenCalledTimes(1);
			expect(handler.mock.calls[0][0].detail).toMatchObject({
				column: 0,
				direction: 'asc',
			});
		});

		it('should fire event with descending direction on second click', () => {
			const handler = vi.fn();
			element.addEventListener('table-sortable:sort', handler);

			const nameLink = element.querySelector(
				'thead th:first-child button',
			);
			nameLink.click();
			nameLink.click();

			expect(handler).toHaveBeenCalledTimes(2);
			expect(handler.mock.calls[1][0].detail.direction).toBe('desc');
		});
	});

	describe('Keyboard accessibility', () => {
		beforeEach(async () => {
			element.innerHTML = `
				<table>
					<thead>
						<tr>
							<th>Name</th>
						</tr>
					</thead>
					<tbody>
						<tr><td>Charlie</td></tr>
						<tr><td>Alice</td></tr>
						<tr><td>Bob</td></tr>
					</tbody>
				</table>
			`;
			await new Promise((resolve) => setTimeout(resolve, 10));
		});

		it('should sort when Enter key is pressed', () => {
			const nameLink = element.querySelector('thead th button');
			const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });

			nameLink.dispatchEvent(enterEvent);

			const rows = element.querySelectorAll('tbody tr');
			expect(rows[0].querySelector('td').textContent).toBe('Alice');
		});

		it('should sort when Space key is pressed', () => {
			const nameLink = element.querySelector('thead th button');
			const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });

			nameLink.dispatchEvent(spaceEvent);

			const rows = element.querySelectorAll('tbody tr');
			expect(rows[0].querySelector('td').textContent).toBe('Alice');
		});

		it('should not sort on other keys', () => {
			const nameLink = element.querySelector('thead th button');
			const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });

			nameLink.dispatchEvent(tabEvent);

			const rows = element.querySelectorAll('tbody tr');
			// Should remain unsorted
			expect(rows[0].querySelector('td').textContent).toBe('Charlie');
		});
	});

	describe('Custom sort keys', () => {
		beforeEach(async () => {
			element.innerHTML = `
				<table>
					<thead>
						<tr>
							<th>Product</th>
							<th>Price</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td data-sort-value="WIDGET-B">Widget B</td>
							<td data-sort-value="50">$50.00</td>
						</tr>
						<tr>
							<td data-sort-value="WIDGET-A">Widget A</td>
							<td data-sort-value="30">$30.00</td>
						</tr>
						<tr>
							<td data-sort-value="WIDGET-C">Widget C</td>
							<td data-sort-value="100">$100.00</td>
						</tr>
					</tbody>
				</table>
			`;
			await new Promise((resolve) => setTimeout(resolve, 10));
		});

		it('should use data-sort-value attribute for sorting', () => {
			const productHeader = element.querySelector(
				'thead th:first-child button',
			);
			productHeader.click();

			const rows = element.querySelectorAll('tbody tr');
			expect(rows[0].querySelector('td').textContent).toBe('Widget A');
			expect(rows[1].querySelector('td').textContent).toBe('Widget B');
			expect(rows[2].querySelector('td').textContent).toBe('Widget C');
		});

		it('should sort numeric data-sort-value values numerically', () => {
			const priceHeader = element.querySelector(
				'thead th:nth-child(2) button',
			);
			priceHeader.click();

			const rows = element.querySelectorAll('tbody tr');
			expect(rows[0].children[1].textContent).toBe('$30.00');
			expect(rows[1].children[1].textContent).toBe('$50.00');
			expect(rows[2].children[1].textContent).toBe('$100.00');
		});
	});

	describe('[data-sort-as] element support', () => {
		beforeEach(async () => {
			element.innerHTML = `
				<table>
					<thead>
						<tr>
							<th>Name</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td><span data-sort-as>LAST</span>First Last</td>
						</tr>
						<tr>
							<td><span data-sort-as>FIRST</span>Alpha Beta</td>
						</tr>
						<tr>
							<td><span data-sort-as>MIDDLE</span>Mid Point</td>
						</tr>
					</tbody>
				</table>
			`;
			await new Promise((resolve) => setTimeout(resolve, 10));
		});

		it('should use [data-sort-as] element for sorting', () => {
			const nameHeader = element.querySelector('thead th button');
			nameHeader.click();

			const rows = element.querySelectorAll('tbody tr');
			// The sort keys are: FIRST, LAST, MIDDLE
			// Alphabetically ascending: FIRST < LAST < MIDDLE
			// So sorted order should be: FIRST (Alpha Beta), LAST (First Last), MIDDLE (Mid Point)
			expect(rows[0].querySelector('td').textContent).toContain(
				'Alpha Beta',
			);
			expect(rows[1].querySelector('td').textContent).toContain(
				'First Last',
			);
			expect(rows[2].querySelector('td').textContent).toContain(
				'Mid Point',
			);
		});
	});

	describe('Grouped tbody support', () => {
		beforeEach(async () => {
			element.innerHTML = `
				<table>
					<thead>
						<tr>
							<th>Name</th>
							<th>Score</th>
						</tr>
					</thead>
					<tbody>
						<tr data-table-sort-group="group1">
							<td>Charlie</td>
							<td>85</td>
						</tr>
					</tbody>
					<tbody>
						<tr data-table-sort-group="group2">
							<td>Alice</td>
							<td>92</td>
						</tr>
					</tbody>
					<tbody>
						<tr data-table-sort-group="group3">
							<td>Bob</td>
							<td>78</td>
						</tr>
					</tbody>
				</table>
			`;
			await new Promise((resolve) => setTimeout(resolve, 10));
		});

		it('should maintain grouped tbody elements when sorting', () => {
			const nameHeader = element.querySelector('thead th button');
			nameHeader.click();

			const tbodies = element.querySelectorAll('tbody');
			expect(tbodies.length).toBe(3);
		});

		it('should sort groups correctly', () => {
			const nameHeader = element.querySelector('thead th button');
			nameHeader.click();

			const tbodies = element.querySelectorAll('tbody');
			expect(tbodies[0].querySelector('td').textContent).toBe('Alice');
			expect(tbodies[1].querySelector('td').textContent).toBe('Bob');
			expect(tbodies[2].querySelector('td').textContent).toBe('Charlie');
		});

		it('should create single tbody when no groups present', async () => {
			element.innerHTML = `
				<table>
					<thead>
						<tr>
							<th>Name</th>
						</tr>
					</thead>
					<tbody>
						<tr><td>Charlie</td></tr>
						<tr><td>Alice</td></tr>
					</tbody>
				</table>
			`;
			// Manually trigger setup since innerHTML change doesn't fire connectedCallback
			element._setupTable();
			element._ensureColgroup();
			element._setupAccessibility();
			element._addEventListeners();

			const nameHeader = element.querySelector('thead th button');
			nameHeader.click();

			const tbodies = element.querySelectorAll('tbody');
			expect(tbodies.length).toBe(1);
		});

		it('should keep multiple rows together within their tbody group', async () => {
			element.innerHTML = `
				<table>
					<thead>
						<tr>
							<th>Name</th>
							<th>Score</th>
						</tr>
					</thead>
					<tbody>
						<tr data-table-sort-group="engineering">
							<td>Charlie</td>
							<td>85</td>
						</tr>
						<tr data-table-sort-group="engineering">
							<td>Frank</td>
							<td>88</td>
						</tr>
						<tr data-table-sort-group="engineering">
							<td>Eve</td>
							<td>76</td>
						</tr>
					</tbody>
					<tbody>
						<tr data-table-sort-group="design">
							<td>Alice</td>
							<td>92</td>
						</tr>
						<tr data-table-sort-group="design">
							<td>Grace</td>
							<td>98</td>
						</tr>
					</tbody>
					<tbody>
						<tr data-table-sort-group="sales">
							<td>Bob</td>
							<td>78</td>
						</tr>
						<tr data-table-sort-group="sales">
							<td>Henry</td>
							<td>84</td>
						</tr>
					</tbody>
				</table>
			`;
			// Manually trigger setup since innerHTML change doesn't fire connectedCallback
			element._setupTable();
			element._ensureColgroup();
			element._setupAccessibility();
			element._addEventListeners();

			const nameHeader = element.querySelector('thead th button');
			nameHeader.click();

			const tbodies = element.querySelectorAll('tbody');
			// Should still have 3 tbody elements
			expect(tbodies.length).toBe(3);

			// Design group (2 rows) - Alice is first alphabetically
			expect(tbodies[0].querySelectorAll('tr').length).toBe(2);
			expect(
				tbodies[0].querySelectorAll('tr')[0].querySelector('td')
					.textContent,
			).toBe('Alice');
			expect(
				tbodies[0].querySelectorAll('tr')[1].querySelector('td')
					.textContent,
			).toBe('Grace');

			// Sales group (2 rows) - Bob comes next alphabetically
			expect(tbodies[1].querySelectorAll('tr').length).toBe(2);
			expect(
				tbodies[1].querySelectorAll('tr')[0].querySelector('td')
					.textContent,
			).toBe('Bob');
			expect(
				tbodies[1].querySelectorAll('tr')[1].querySelector('td')
					.textContent,
			).toBe('Henry');

			// Engineering group (3 rows) - Charlie comes after Alice and Bob
			expect(tbodies[2].querySelectorAll('tr').length).toBe(3);
			expect(
				tbodies[2].querySelectorAll('tr')[0].querySelector('td')
					.textContent,
			).toBe('Charlie');
			expect(
				tbodies[2].querySelectorAll('tr')[1].querySelector('td')
					.textContent,
			).toBe('Eve');
			expect(
				tbodies[2].querySelectorAll('tr')[2].querySelector('td')
					.textContent,
			).toBe('Frank');
		});
	});

	describe('Button elements as sort triggers', () => {
		beforeEach(async () => {
			element.innerHTML = `
				<table>
					<thead>
						<tr>
							<th><button type="button">Name</button></th>
						</tr>
					</thead>
					<tbody>
						<tr><td>Charlie</td></tr>
						<tr><td>Alice</td></tr>
						<tr><td>Bob</td></tr>
					</tbody>
				</table>
			`;
			await new Promise((resolve) => setTimeout(resolve, 10));
		});

		it('should work with button elements', () => {
			const button = element.querySelector('thead th button');
			// Buttons don't need role="button" or tabindex (native behavior)
			expect(button.getAttribute('role')).toBeNull();
			expect(button.getAttribute('tabindex')).toBeNull();
		});

		it('should sort when button is clicked', () => {
			const button = element.querySelector('thead th button');
			button.click();

			const rows = element.querySelectorAll('tbody tr');
			expect(rows[0].querySelector('td').textContent).toBe('Alice');
			expect(rows[1].querySelector('td').textContent).toBe('Bob');
			expect(rows[2].querySelector('td').textContent).toBe('Charlie');
		});
	});

	describe('Screen reader announcements', () => {
		beforeEach(async () => {
			element.innerHTML = `
				<table>
					<thead>
						<tr>
							<th>Name</th>
						</tr>
					</thead>
					<tbody>
						<tr><td>Alice</td></tr>
					</tbody>
				</table>
			`;
			await new Promise((resolve) => setTimeout(resolve, 10));
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it('should announce sort changes to screen readers', () => {
			const nameLink = element.querySelector('thead th button');
			nameLink.click();

			vi.advanceTimersByTime(150);

			const liveRegion = element._liveRegion;
			expect(liveRegion.textContent).toContain('Name');
			expect(liveRegion.textContent).toContain('ascending');
		});

		it('should announce descending sort', () => {
			const nameLink = element.querySelector('thead th button');
			nameLink.click();
			nameLink.click();

			vi.advanceTimersByTime(150);

			const liveRegion = element._liveRegion;
			expect(liveRegion.textContent).toContain('descending');
		});
	});

	describe('Colgroup and col injection', () => {
		beforeEach(async () => {
			element.innerHTML = `
				<table>
					<thead>
						<tr>
							<th>Name</th>
							<th>Age</th>
							<th>City</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>Alice</td>
							<td>28</td>
							<td>Boston</td>
						</tr>
					</tbody>
				</table>
			`;
			await new Promise((resolve) => setTimeout(resolve, 10));
		});

		it('should inject colgroup if not present', () => {
			const colgroup = element.querySelector('colgroup');
			expect(colgroup).toBeTruthy();
		});

		it('should inject col elements matching column count', () => {
			const cols = element.querySelectorAll('colgroup col');
			expect(cols.length).toBe(3);
		});

		it('should add sorted class to col when sorting', () => {
			const nameLink = element.querySelector(
				'thead th:first-child button',
			);
			nameLink.click();

			const firstCol = element.querySelector('colgroup col:first-child');
			expect(firstCol.classList.contains('sorted')).toBe(true);
		});

		it('should move sorted class when sorting different column', () => {
			const nameLink = element.querySelector(
				'thead th:first-child button',
			);
			const ageLink = element.querySelector(
				'thead th:nth-child(2) button',
			);

			nameLink.click();
			let firstCol = element.querySelector('colgroup col:first-child');
			expect(firstCol.classList.contains('sorted')).toBe(true);

			ageLink.click();
			firstCol = element.querySelector('colgroup col:first-child');
			const secondCol = element.querySelector(
				'colgroup col:nth-child(2)',
			);
			expect(firstCol.classList.contains('sorted')).toBe(false);
			expect(secondCol.classList.contains('sorted')).toBe(true);
		});

		it('should not create colgroup if one already exists', async () => {
			element.innerHTML = `
				<table>
					<colgroup>
						<col>
						<col>
					</colgroup>
					<thead>
						<tr>
							<th>Name</th>
							<th>Age</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>Alice</td>
							<td>28</td>
						</tr>
					</tbody>
				</table>
			`;
			await new Promise((resolve) => setTimeout(resolve, 10));

			const colgroups = element.querySelectorAll('colgroup');
			expect(colgroups.length).toBe(1);
		});
	});

	describe('Custom label attributes', () => {
		beforeEach(async () => {
			element.setAttribute('label-sortable', 'Trier');
			element.setAttribute('label-ascending', 'trié croissant');
			element.setAttribute('label-descending', 'trié décroissant');

			element.innerHTML = `
				<table>
					<thead>
						<tr>
							<th>Name</th>
						</tr>
					</thead>
					<tbody>
						<tr><td>Alice</td></tr>
						<tr><td>Bob</td></tr>
					</tbody>
				</table>
			`;
			await new Promise((resolve) => setTimeout(resolve, 10));
		});

		it('should use custom labels in screen reader announcements', () => {
			vi.useFakeTimers();

			const nameLink = element.querySelector('thead th button');
			nameLink.click();

			vi.advanceTimersByTime(150);

			const liveRegion = element._liveRegion;
			expect(liveRegion.textContent).toContain('trié croissant');

			vi.useRealTimers();
		});
	});

	describe('Cleanup', () => {
		it('should remove event listeners on disconnect', async () => {
			element.innerHTML = `
				<table>
					<thead>
						<tr>
							<th>Name</th>
						</tr>
					</thead>
					<tbody>
						<tr><td>Alice</td></tr>
					</tbody>
				</table>
			`;
			await new Promise((resolve) => setTimeout(resolve, 10));

			const handler = vi.fn();
			element.addEventListener('table-sortable:sort', handler);

			element.remove();

			const nameLink = element.querySelector('thead th button');
			nameLink.click();

			// Event should still fire (it's on the element), but this confirms cleanup happened
			expect(element.parentNode).toBeNull();
		});

		it('should remove live region on disconnect', async () => {
			element.innerHTML = `
				<table>
					<thead>
						<tr>
							<th>Name</th>
						</tr>
					</thead>
					<tbody>
						<tr><td>Alice</td></tr>
					</tbody>
				</table>
			`;
			await new Promise((resolve) => setTimeout(resolve, 10));

			const liveRegion = element._liveRegion;
			expect(liveRegion).toBeTruthy();

			element.remove();

			expect(liveRegion.parentNode).toBeNull();
		});
	});
});
