/**
 * TableSortableElement - A web component to enable users to sort table data by clicking on column headers.
 *
 * Based on jquery.easy-sortable-tables.js by Aaron Gustafson
 * @see https://github.com/easy-designs/jquery.easy-sortable-tables.js
 *
 * @element table-sortable
 *
 * @fires table-sortable:sort - Fired when a column is sorted. Detail: { column: number, direction: 'asc'|'desc', header: HTMLElement }
 *
 * @slot - Default slot for the table element
 *
 * @attr {string} label-sortable - Custom label for sortable columns (default: "Click to sort")
 * @attr {string} label-ascending - Custom label for ascending sort (default: "sorted ascending. Click to sort descending")
 * @attr {string} label-descending - Custom label for descending sort (default: "sorted descending. Click to sort ascending")
 *
 * @cssprop --table-sortable-indicator-asc - Ascending sort indicator (default: ↑)
 * @cssprop --table-sortable-indicator-desc - Descending sort indicator (default: ↓)
 */
export class TableSortableElement extends HTMLElement {
	/**
	 * Inject default styles for sort indicators
	 * Since this component uses light DOM (not shadow DOM) to work with existing
	 * table markup, we inject a shared stylesheet into the document head.
	 * @private
	 */
	static _injectStyles() {
		// Check if styles already exist
		if (document.getElementById('table-sortable-styles')) {
			return;
		}

		const style = document.createElement('style');
		style.id = 'table-sortable-styles';
		style.textContent = `
			table-sortable thead th[aria-sort="ascending"] button::after {
				content: var(--sort-indicator-asc, '↑') / '';
			}
			table-sortable thead th[aria-sort="descending"] button::after {
				content: var(--sort-indicator-desc, '↓') / '';
			}
		`;
		document.head.appendChild(style);
	}

	/**
	 * Find the sort key for a cell
	 * @private
	 */
	static _findSortKey(cell) {
		if (cell.hasAttribute('data-sort-value')) {
			return cell.getAttribute('data-sort-value');
		}

		const sortKeyElement = cell.querySelector('[data-sort-as]');
		if (sortKeyElement) {
			// Use the sort key element's text, then append the rest of the cell text
			// This matches the original jQuery implementation
			const sortKeyText = sortKeyElement.textContent.trim().toUpperCase();
			const remainingText = cell.textContent
				.replace(sortKeyElement.textContent, '')
				.trim()
				.toUpperCase();
			return sortKeyText + ' ' + remainingText;
		}

		return cell.textContent.trim().toUpperCase();
	}

	constructor() {
		super();
		this._handleSort = this._handleSort.bind(this);
		this._handleKeyDown = this._handleKeyDown.bind(this);
		this._announcementTimeout = null;
	}

	connectedCallback() {
		// Use setTimeout to ensure slotted content is available
		setTimeout(() => {
			TableSortableElement._injectStyles();
			this._setupTable();
			this._ensureColgroup();
			this._setupAccessibility();
			this._addEventListeners();
			this._createLiveRegion();
		}, 0);
	}

	disconnectedCallback() {
		this._removeEventListeners();
		this._removeLiveRegion();
		if (this._announcementTimeout) {
			clearTimeout(this._announcementTimeout);
		}
	}

	/**
	 * Set up the table and make headers sortable
	 * @private
	 */
	_setupTable() {
		const table = this.querySelector('table');
		if (!table) {
			console.warn('table-sortable: No table element found');
			return;
		}

		this._table = table;
	}

	/**
	 * Ensure colgroup and col elements exist for column styling
	 * @private
	 */
	_ensureColgroup() {
		if (!this._table) return;

		// Check if colgroup already exists
		let colgroup = this._table.querySelector('colgroup');

		if (!colgroup) {
			// Create colgroup
			colgroup = document.createElement('colgroup');

			// Count columns from thead
			const thead = this._table.querySelector('thead tr');
			if (!thead) return;

			const columnCount = thead.children.length;

			// Create col elements
			for (let i = 0; i < columnCount; i++) {
				const col = document.createElement('col');
				colgroup.appendChild(col);
			}

			// Insert colgroup as first child of table
			this._table.insertBefore(colgroup, this._table.firstChild);
		}

		this._colgroup = colgroup;
	}

	/**
	 * Set up accessibility features on sortable headers
	 * Progressive enhancement: automatically creates buttons in header cells
	 * @private
	 */
	_setupAccessibility() {
		if (!this._table) return;

		const headers = this._table.querySelectorAll('thead th');
		headers.forEach((th) => {
			// Create a button for the header
			const button = document.createElement('button');
			button.type = 'button';
			button.textContent = th.textContent.trim();

			// Clear th and append button
			th.textContent = '';
			th.appendChild(button);

			// Set aria-sort attribute
			th.setAttribute('aria-sort', 'none');
		});
	}

	/**
	 * Get custom label text from attributes
	 * @private
	 */
	_getLabel(type) {
		const defaults = {
			sortable: 'Click to sort',
			ascending: 'sorted ascending. Click to sort descending',
			descending: 'sorted descending. Click to sort ascending',
		};

		const attrName = `label-${type}`;
		return this.getAttribute(attrName) || defaults[type];
	}

	/**
	 * Create a live region for screen reader announcements
	 * @private
	 */
	_createLiveRegion() {
		this._liveRegion = document.createElement('div');
		this._liveRegion.setAttribute('role', 'status');
		this._liveRegion.setAttribute('aria-live', 'polite');
		this._liveRegion.setAttribute('aria-atomic', 'true');
		this._liveRegion.style.position = 'absolute';
		this._liveRegion.style.left = '-10000px';
		this._liveRegion.style.width = '1px';
		this._liveRegion.style.height = '1px';
		this._liveRegion.style.overflow = 'hidden';
		this.appendChild(this._liveRegion);
	}

	/**
	 * Remove the live region
	 * @private
	 */
	_removeLiveRegion() {
		if (this._liveRegion && this._liveRegion.parentNode) {
			this._liveRegion.parentNode.removeChild(this._liveRegion);
		}
	}

	/**
	 * Announce sorting change to screen readers
	 * @private
	 */
	_announceSort(headerText, direction) {
		if (!this._liveRegion) return;

		const directionLabel =
			direction === 1
				? this._getLabel('ascending')
				: this._getLabel('descending');
		const message = `${headerText}, ${directionLabel}`;

		// Clear previous announcement
		this._liveRegion.textContent = '';

		// Delay to ensure screen readers pick up the change
		if (this._announcementTimeout) {
			clearTimeout(this._announcementTimeout);
		}

		this._announcementTimeout = setTimeout(() => {
			this._liveRegion.textContent = message;
		}, 100);
	}

	/**
	 * Add event listeners
	 * @private
	 */
	_addEventListeners() {
		if (!this._table) return;

		const buttons = this._table.querySelectorAll('thead th button');
		buttons.forEach((button) => {
			button.addEventListener('click', this._handleSort);
			button.addEventListener('keydown', this._handleKeyDown);
		});
	}

	/**
	 * Remove event listeners
	/**
	 * Remove event listeners
	 * @private
	 */
	_removeEventListeners() {
		if (!this._table) return;

		const buttons = this._table.querySelectorAll('thead th button');
		buttons.forEach((button) => {
			button.removeEventListener('click', this._handleSort);
			button.removeEventListener('keydown', this._handleKeyDown);
		});
	}

	/**
	 * Handle keyboard interaction
	 * @private
	 */
	_handleKeyDown(event) {
		// Activate on Enter or Space
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			this._handleSort(event);
		}
	}

	/**
	 * Handle sort click/activation
	 * @private
	 */
	_handleSort(event) {
		event.preventDefault();

		const button = event.target.closest('button');
		if (!button) return;

		const th = button.closest('th');
		const column = Array.from(th.parentNode.children).indexOf(th);
		const currentDirection = th.classList.contains('up') ? 1 : -1;
		const direction = currentDirection === 1 ? -1 : 1;

		// Sort the table
		this._sortTable(column, direction, th);

		// Fire custom event
		this.dispatchEvent(
			new CustomEvent('table-sortable:sort', {
				bubbles: true,
				detail: {
					column,
					direction: direction === 1 ? 'asc' : 'desc',
					header: th,
				},
			}),
		);

		// Announce to screen readers
		const headerText = th.textContent.trim();
		this._announceSort(headerText, direction);
	}

	/**
	 * Sort the table by the specified column
	 * @private
	 */
	_sortTable(column, direction, activeHeader) {
		if (!this._table) return;

		// Check if we have grouped rows
		const hasGroups =
			this._table.querySelectorAll('tr[data-table-sort-group]').length >
			0;

		// Get all rows from tbody elements
		const rows = Array.from(this._table.querySelectorAll('tbody tr'));

		// Remove all tbody elements
		const tbodies = this._table.querySelectorAll('tbody');
		tbodies.forEach((tbody) => tbody.remove());

		// Clear active states and aria-sort
		const allHeaders = this._table.querySelectorAll('thead th');
		allHeaders.forEach((header) => {
			header.classList.remove('active', 'up', 'down');
			header.setAttribute('aria-sort', 'none');
		});

		// Clear sorted class from all cols
		if (this._colgroup) {
			const cols = this._colgroup.querySelectorAll('col');
			cols.forEach((col) => col.classList.remove('sorted'));
		}

		// Set active state and aria-sort
		activeHeader.classList.add('active', direction === 1 ? 'up' : 'down');
		activeHeader.setAttribute(
			'aria-sort',
			direction === 1 ? 'ascending' : 'descending',
		);

		// Add sorted class to corresponding col
		if (this._colgroup) {
			const cols = this._colgroup.querySelectorAll('col');
			if (cols[column]) {
				cols[column].classList.add('sorted');
			}
		}

		// Assign sort keys to rows
		rows.forEach((row) => {
			const cell = row.children[column];
			if (!cell) {
				row._sortKey = '';
				return;
			}

			const sortKey = TableSortableElement._findSortKey(cell);
			const numericValue = parseInt(sortKey, 10);

			// Use numeric comparison if the value is a valid number
			row._sortKey =
				!isNaN(numericValue) &&
				numericValue.toString() === sortKey.trim()
					? numericValue
					: sortKey;
		});

		// Sort rows
		rows.sort((a, b) => {
			if (a._sortKey < b._sortKey) return -direction;
			if (a._sortKey > b._sortKey) return direction;
			return 0;
		});

		// Re-append rows
		if (hasGroups) {
			this._appendGroupedRows(rows);
		} else {
			this._appendSingleTbody(rows);
		}

		// Clean up sort keys
		rows.forEach((row) => {
			delete row._sortKey;
		});
	}

	/**
	 * Append rows as grouped tbody elements
	 * @private
	 */
	_appendGroupedRows(rows) {
		// Group rows by their data-table-sort-group attribute
		const groups = new Map();

		rows.forEach((row) => {
			const group = row.getAttribute('data-table-sort-group');
			if (!groups.has(group)) {
				groups.set(group, []);
			}
			groups.get(group).push(row);
		});

		// Create tbody for each group and append rows
		groups.forEach((groupRows) => {
			const tbody = document.createElement('tbody');
			groupRows.forEach((row) => {
				tbody.appendChild(row);
			});
			this._table.appendChild(tbody);
		});
	}

	/**
	 * Append rows as a single tbody
	 * @private
	 */
	_appendSingleTbody(rows) {
		const tbody = document.createElement('tbody');
		rows.forEach((row) => {
			tbody.appendChild(row);
		});
		this._table.appendChild(tbody);
	}
}
