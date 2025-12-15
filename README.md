# table-sortable Web Component

[![npm version](https://img.shields.io/npm/v/@aarongustafson/table-sortable.svg)](https://www.npmjs.com/package/@aarongustafson/table-sortable) [![Build Status](https://img.shields.io/github/actions/workflow/status/aarongustafson/table-sortable/ci.yml?branch=main)](https://github.com/aarongustafson/table-sortable/actions)

A web component to enable users to sort table data by clicking on column headers. Built with accessibility in mind, featuring keyboard navigation, screen reader announcements, and light DOM manipulation.

Based on the original [jquery.easy-sortable-tables.js](https://github.com/easy-designs/jquery.easy-sortable-tables.js) by Aaron Gustafson.

## Features

- ✅ **Accessible**: Full keyboard navigation support with Enter/Space activation
- ✅ **Screen Reader Friendly**: Announces sort changes via ARIA live regions
- ✅ **Light DOM**: No Shadow DOM - works with your existing table markup
- ✅ **Flexible Sorting**: Supports text, numeric, and custom sort keys
- ✅ **Grouped Tables**: Maintains grouped `tbody` elements when sorting
- ✅ **No Dependencies**: Pure vanilla JavaScript web component
- ✅ **Small Footprint**: Lightweight and performant

## Demo

- [Full Demo](https://aarongustafson.github.io/table-sortable/demo/) ([Source](./demo/index.html))
- [unpkg CDN Demo](https://aarongustafson.github.io/table-sortable/demo/unpkg.html) ([Source](./demo/unpkg.html))
- [esm.sh CDN Demo](https://aarongustafson.github.io/table-sortable/demo/esm.html) ([Source](./demo/esm.html))

## Installation

```bash
npm install @aarongustafson/table-sortable
```

## Usage

> **TypeScript ready**
>
> The package ships with `table-sortable.d.ts`. Importing either the class (`{ TableSortableElement }`) or the guarded definition helper automatically provides typed event payloads (`table-sortable:sort`) and reflective properties (`labelSortable`, `labelAscending`, `labelDescending`).

### Option 1: Import the class and define manually

Import the class and define the custom element with your preferred tag name:

```javascript
import { TableSortableElement } from '@aarongustafson/table-sortable';

customElements.define('my-custom-name', TableSortableElement);
```

### Option 2: Auto-define the custom element (browser environments only)

Use the guarded definition helper to register the element when `customElements` is available:

```javascript
import '@aarongustafson/table-sortable/define.js';
```

If you prefer to control when the element is registered, call the helper directly:

```javascript
import { defineTableSortable } from '@aarongustafson/table-sortable/define.js';

defineTableSortable();
```

You can also include the guarded script from HTML:

```html
<script src="./node_modules/@aarongustafson/table-sortable/define.js" type="module"></script>
```

### Basic Example

Wrap your existing table in a `<table-sortable>` element. The component uses **progressive enhancement** - it will automatically inject sortable buttons into table headers:

```html
<table-sortable>
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
</table-sortable>
```

The component uses **pure progressive enhancement** - it automatically creates accessible `<button>` elements inside each `<th>` for sorting. You don't need to add any buttons or links manually.

## Advanced Usage

### Custom Sort Keys

Use the `data-sort-value` attribute to specify a custom value to sort by, different from the displayed content:

```html
<table-sortable>
  <table>
    <thead>
      <tr>
        <th>Product</th>
        <th>Price</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td data-sort-value="WIDGET-B">Widget B (Premium)</td>
        <td data-sort-value="50">$50.00</td>
      </tr>
      <tr>
        <td data-sort-value="WIDGET-A">Widget A (Basic)</td>
        <td data-sort-value="30">$30.00</td>
      </tr>
    </tbody>
  </table>
</table-sortable>
```

This is useful for:
- Sorting formatted numbers (currency, percentages)
- Sorting dates by ISO format while displaying a friendly format
- Custom sorting logic (e.g., priority: High > Medium > Low)

### Hidden Sort Keys

Use an element with the class `[data-sort-as]` to provide a hidden sort value:

```html
<table-sortable>
  <table>
    <thead>
      <tr>
        <th>Full Name</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span data-sort-as>SMITH</span>John Smith</td>
      </tr>
      <tr>
        <td><span data-sort-as>ANDERSON</span>Emily Anderson</td>
      </tr>
    </tbody>
  </table>
</table-sortable>
```

The `[data-sort-as]` element should be hidden with CSS:

```css
[data-sort-as] {
  display: none;
}
```

This allows sorting by last name while displaying "First Last" format.

### Grouped Tables

To maintain groupings while sorting, use multiple `<tbody>` elements with `data-table-sort-group` attributes:

```html
<table-sortable>
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Score</th>
      </tr>
    </thead>
    <tbody>
      <tr data-table-sort-group="engineering">
        <td>Charlie (Engineering)</td>
        <td>85</td>
      </tr>
    </tbody>
    <tbody>
      <tr data-table-sort-group="design">
        <td>Alice (Design)</td>
        <td>92</td>
      </tr>
    </tbody>
    <tbody>
      <tr data-table-sort-group="sales">
        <td>Bob (Sales)</td>
        <td>78</td>
      </tr>
    </tbody>
  </table>
</table-sortable>
```

Each group (tbody) will be sorted independently and maintain its structure.

## Events

The component fires custom events that you can listen to:

| Event | Description | Detail |
|-------|-------------|--------|
| `table-sortable:sort` | Fired when a column is sorted | `{ column: number, direction: 'asc'\|'desc', header: HTMLElement }` |

### Example Event Handling

```javascript
const element = document.querySelector('table-sortable');

element.addEventListener('table-sortable:sort', (event) => {
  const { column, direction, header } = event.detail;
  console.log(`Sorted column ${column} (${header.textContent}) in ${direction}ending order`);
});
```

## Attributes

The component supports attributes for customizing screen reader announcements:

| Attribute | Description | Default |
|-----------|-------------|---------|
| `label-sortable` | Label for unsorted columns | "Click to sort" |
| `label-ascending` | Label when sorted ascending | "sorted ascending. Click to sort descending" |
| `label-descending` | Label when sorted descending | "sorted descending. Click to sort ascending" |

### Example Localization

```html
<table-sortable
  label-sortable="Cliquez pour trier"
  label-ascending="trié croissant. Cliquez pour trier décroissant"
  label-descending="trié décroissant. Cliquez pour trier croissant">
  <table>
    <!-- table content -->
  </table>
</table-sortable>
```

## Styling

The component uses light DOM, so you can style the table normally with CSS. The component adds these classes to help style sort indicators:

| Class | Applied To | Description |
|-------|-----------|-------------|
| `active` | `<th>` | The currently sorted column |
| `up` | `<th>` | Column sorted in ascending order |
| `down` | `<th>` | Column sorted in descending order |
| `sorted` | `<col>` | The currently sorted column (for column styling) |

### CSS Custom Properties

The component supports CSS custom properties for visual indicators:

| Property | Description | Default |
|----------|-------------|---------||
| `--table-sortable-indicator-asc` | Ascending sort indicator | `↑` |
| `--table-sortable-indicator-desc` | Descending sort indicator | `↓` |

### Example Styling

```css
/* Customize sort indicators */
table-sortable {
  --table-sortable-indicator-asc: '▲';
  --table-sortable-indicator-desc: '▼';
}

/* Style active column header */
thead th.active {
  background-color: #e3f2fd;
}

/* Highlight sorted column */
col.sorted {
  background-color: rgba(0, 102, 204, 0.05);
}
```

## Accessibility Features

The component is built with accessibility as a priority:

1. **Keyboard Navigation**:
   - All sortable headers are focusable with Tab
   - Activate sorting with `Enter` or `Space` keys

2. **Screen Reader Support**:
   - `aria-sort` attribute indicates column sort state (ascending, descending, none)
   - Live region announces sort changes using customizable labels
   - Updates are announced politely without interrupting

3. **Progressive Enhancement**:
   - Automatically creates accessible buttons if none are provided
   - Works with existing links or buttons in markup

4. **Visual Indicators**:
   - CSS classes indicate active column and sort direction
   - Focus indicators for keyboard navigation
   - Column highlighting via `<col>` elements

## Column Highlighting

The component automatically injects `<colgroup>` and `<col>` elements if they don't exist, allowing you to style entire columns. The currently sorted column receives a `.sorted` class on its corresponding `<col>` element.

## Sorting Behavior

- **First click**: Sort ascending
- **Second click**: Sort descending
- **Text sorting**: Case-insensitive alphabetical
- **Numeric sorting**: Automatic detection and numeric comparison
- **Mixed content**: Text values sort before or after numbers depending on direction

The component automatically detects numeric values and sorts them numerically rather than alphabetically (so 100 comes after 20, not after 1).

## Browser Support

This component uses modern web standards:
- Custom Elements v1
- ES Modules
- ES6+ JavaScript features

**Supported Browsers:**
- Chrome/Edge 88+
- Firefox 87+
- Safari 14+

For older browsers, you may need polyfills from [@webcomponents/webcomponentsjs](https://github.com/webcomponents/polyfills/tree/master/packages/webcomponentsjs).

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format

# View demo locally
open demo/index.html
```

## License

MIT © [Aaron Gustafson](https://www.aaron-gustafson.com/)

Based on [jquery.easy-sortable-tables.js](https://github.com/easy-designs/jquery.easy-sortable-tables.js) © Aaron Gustafson
