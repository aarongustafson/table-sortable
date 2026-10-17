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
 * @attr {string} label-sortable - Custom label for sortable columns (default: "Click to sort ascending")
 * @attr {string} label-ascending - Custom label for ascending sort (default: "sorted ascending. Click to sort descending")
 * @attr {string} label-descending - Custom label for descending sort (default: "sorted descending. Click to sort ascending")
 *
 * @cssprop --table-sortable-indicator-asc - Ascending sort indicator (default: ↑)
 * @cssprop --table-sortable-indicator-desc - Descending sort indicator (default: ↓)
 */
let nextDescriptionId = 0;

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
			table-sortable .table-sortable-description {
				position: absolute;
				width: 1px;
				height: 1px;
				padding: 0;
				margin: -1px;
				overflow: hidden;
				clip: rect(0, 0, 0, 0);
				white-space: nowrap;
				border: 0;
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
		this._descriptionId = ++nextDescriptionId;
		this._descriptionIds = {
			sortable: `table-sortable-description-${this._descriptionId}-sortable`,
			ascending: `table-sortable-description-${this._descriptionId}-ascending`,
			descending: `table-sortable-description-${this._descriptionId}-descending`,
		};
		this._pendingInitFrame = null;
	}

	connectedCallback() {
		this._upgradeProperty('labelSortable');
		this._upgradeProperty('labelAscending');
		this._upgradeProperty('labelDescending');
		this._scheduleInitialization();
	}

	disconnectedCallback() {
		if (this._pendingInitFrame !== null) {
			cancelAnimationFrame(this._pendingInitFrame);
			this._pendingInitFrame = null;
		}
		this._removeEventListeners();
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
		const descriptions = Object.entries(this._descriptionIds).map(
			([state, id]) => {
				const description = document.createElement('span');
				description.id = id;
				description.className = 'table-sortable-description';
				description.textContent = this._getLabel(state);
				return description;
			},
		);

		headers.forEach((th) => {
			// Create a button for the header
			const button = document.createElement('button');
			button.type = 'button';
			button.textContent = th.textContent.trim();
			button.setAttribute(
				'aria-describedby',
				this._descriptionIds.sortable,
			);

			// Clear th and append accessible controls
			th.textContent = '';
			th.appendChild(button);

			// Set aria-sort attribute
			th.setAttribute('aria-sort', 'none');
		});

		headers[0]?.append(...descriptions);
	}

	/**
	 * Get custom label text from attributes
	 * @private
	 */
	_getLabel(type) {
		const defaults = {
			sortable: 'Click to sort ascending',
			ascending: 'sorted ascending. Click to sort descending',
			descending: 'sorted descending. Click to sort ascending',
		};

		const labelValues = {
			sortable: this.labelSortable,
			ascending: this.labelAscending,
			descending: this.labelDescending,
		};

		return labelValues[type] || defaults[type];
	}

	get labelSortable() {
		return this.getAttribute('label-sortable');
	}

	set labelSortable(value) {
		this._reflectStringAttribute('label-sortable', value);
	}

	get labelAscending() {
		return this.getAttribute('label-ascending');
	}

	set labelAscending(value) {
		this._reflectStringAttribute('label-ascending', value);
	}

	get labelDescending() {
		return this.getAttribute('label-descending');
	}

	set labelDescending(value) {
		this._reflectStringAttribute('label-descending', value);
	}

	_initialize() {
		TableSortableElement._injectStyles();
		this._setupTable();
		this._ensureColgroup();
		this._setupAccessibility();
		this._addEventListeners();
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
	}

	/**
	 * Sort the table by the specified column
	 * @private
	 */
	_sortTable(column, direction, activeHeader) {
		if (!this._table) return;

		// Get all rows from tbody elements
		const rows = Array.from(this._table.querySelectorAll('tbody tr'));
		const rowGroups = new Map();
		let hasGroups = false;

		rows.forEach((row) => {
			const group =
				row.getAttribute('data-table-sort-group') ??
				row.closest('tbody')?.getAttribute('data-table-sort-group') ??
				null;
			rowGroups.set(row, group);
			hasGroups ||= group !== null;
		});

		// Remove all tbody elements
		const tbodies = this._table.querySelectorAll('tbody');
		tbodies.forEach((tbody) => tbody.remove());

		// Clear active states and aria-sort
		const allHeaders = this._table.querySelectorAll('thead th');
		allHeaders.forEach((header) => {
			header.classList.remove('active', 'up', 'down');
			header.setAttribute('aria-sort', 'none');
			header
				.querySelector('button')
				?.setAttribute(
					'aria-describedby',
					this._descriptionIds.sortable,
				);
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
		activeHeader
			.querySelector('button')
			?.setAttribute(
				'aria-describedby',
				this._descriptionIds[
					direction === 1 ? 'ascending' : 'descending'
				],
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
			const normalizedSortKey = sortKey.trim();
			const isNumeric = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(
				normalizedSortKey,
			);
			const numericValue = isNumeric
				? Number(normalizedSortKey)
				: Number.NaN;

			// Use numeric comparison if the value is a valid number
			row._sortKey = Number.isFinite(numericValue)
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
			this._appendGroupedRows(rows, rowGroups);
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
	_appendGroupedRows(rows, rowGroups) {
		const groups = new Map();

		rows.forEach((row) => {
			const group = rowGroups.get(row);
			if (!groups.has(group)) {
				groups.set(group, []);
			}
			groups.get(group).push(row);
		});

		// Create tbody for each group and append rows
		groups.forEach((groupRows, group) => {
			const tbody = document.createElement('tbody');
			if (group !== null) {
				tbody.setAttribute('data-table-sort-group', group);
			}
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

	_scheduleInitialization() {
		if (!this.isConnected) {
			return;
		}

		if (this._pendingInitFrame !== null) {
			cancelAnimationFrame(this._pendingInitFrame);
		}

		this._pendingInitFrame = requestAnimationFrame(() => {
			this._pendingInitFrame = null;
			this._initialize();
		});
	}

	_reflectStringAttribute(attrName, value) {
		if (value === null || value === undefined || value === '') {
			this.removeAttribute(attrName);
			return;
		}
		this.setAttribute(attrName, String(value));
	}

	_upgradeProperty(prop) {
		if (Object.prototype.hasOwnProperty.call(this, prop)) {
			const value = this[prop];
			delete this[prop];
			this[prop] = value;
		}
	}
}
