# table-sortable Web Component

[![npm version](https://img.shields.io/npm/v/@aarongustafson/table-sortable.svg)](https://www.npmjs.com/package/@aarongustafson/table-sortable)
[![CI status](https://img.shields.io/github/actions/workflow/status/aarongustafson/table-sortable/ci.yml?branch=main&label=CI)](https://github.com/aarongustafson/table-sortable/actions/workflows/ci.yml)
[![Minified + gzipped size](https://img.shields.io/bundlejs/size/@aarongustafson/table-sortable?format=minzip&label=min%2Bgzip)](https://bundlejs.com/?q=@aarongustafson/table-sortable)
[![License](https://img.shields.io/npm/l/@aarongustafson/table-sortable)](https://github.com/aarongustafson/table-sortable/blob/main/LICENSE)
[![Type definitions](https://img.shields.io/npm/types/@aarongustafson/table-sortable)](https://github.com/aarongustafson/table-sortable/blob/main/table-sortable.d.ts)

A web component to enable users to sort table data by clicking on column headers. Built with accessibility in mind, featuring keyboard navigation, native sort semantics, and light DOM manipulation.

Based on the original [jquery.easy-sortable-tables.js](https://github.com/easy-designs/jquery.easy-sortable-tables.js) by Aaron Gustafson.

## Features

- ✅ **Keyboard Controls**: Native header buttons with Enter/Space activation
- ✅ **Screen Reader Friendly**: Exposes sort changes with `aria-sort` and described buttons
- ✅ **Light DOM**: No Shadow DOM - works with your existing table markup
- ✅ **Flexible Sorting**: Supports text, numeric, and custom sort keys
- ✅ **Grouped Tables**: Keeps related rows together when sorting
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

The shared indicator and visually hidden description styles target
`table-sortable`. If you choose another tag, provide equivalent styles for that
tag, including `.table-sortable-description`. The demos use the default tag.

### Option 2: Auto-define the custom element (browser environments only)

Use the guarded definition helper to register the element when `customElements` is available:

```javascript
import '@aarongustafson/table-sortable/define.js';
```

Importing the helper module registers `table-sortable`, including when you use a
named import. Calling the helper again is safe for the same tag:

```javascript
import { defineTableSortable } from '@aarongustafson/table-sortable/define.js';

defineTableSortable();
```

The helper returns `false` without a usable browser custom-element registry,
otherwise `true`. Its optional `tagName` argument defaults to `table-sortable`.
Use the class-only import to control registration timing. A constructor can’t
be registered under multiple names in the same registry.

You can also include the guarded script from HTML:

```html
<script
  src="./node_modules/@aarongustafson/table-sortable/define.js"
  type="module"
></script>
```

### Basic Example

Wrap your existing table in a `<table-sortable>` element. The component uses **progressive enhancement** - it will automatically inject sortable buttons into table headers:

```html
<table-sortable tabindex="0" role="region" aria-label="People table">
  <table>
    <caption>
      People and cities
    </caption>
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

Without JavaScript, or if the module fails to load, the native table remains
readable in its authored order. After registration, initialization runs in an
animation frame. The component replaces each `<thead>` header’s contents with a button
using that header’s trimmed text. Use plain text headers, not existing links,
buttons, or markup you need to preserve.

The named, focusable region is authored markup, not something the component
adds. With the overflow styles below, keyboard users can focus that region and
scroll a wide table without losing columns.

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

### Inline Sort Keys with `data-sort-as`

Use a `[data-sort-as]` element to mark the visible text fragment that should lead sorting:

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
        <td>John <span data-sort-as>Smith</span></td>
      </tr>
      <tr>
        <td>Emily <span data-sort-as>Anderson</span></td>
      </tr>
    </tbody>
  </table>
</table-sortable>
```

This allows sorting by last name while still displaying the full name naturally.

If you need a sort token that should not be visible, you can still hide a `[data-sort-as]` element with CSS, but visible text is generally preferable to reduce duplicated content.

### Grouped Tables

To keep related rows together while sorting, add the same
`data-table-sort-group` value to every `<tr>` in a group:

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
      <tr data-table-sort-group="engineering">
        <td>Frank (Engineering)</td>
        <td>88</td>
      </tr>
      <tr data-table-sort-group="design">
        <td>Alice (Design)</td>
        <td>92</td>
      </tr>
      <tr data-table-sort-group="sales">
        <td>Bob (Sales)</td>
        <td>78</td>
      </tr>
    </tbody>
  </table>
</table-sortable>
```

Sorting moves the original row nodes into new `<tbody>` elements. Rows with
the same effective group value stay together. The original body attributes,
apart from the effective group key, aren’t copied.

Use a normal `<tbody>` around the table's data rows, as shown above. You do not
need to provide a separate `<tbody>` for each group. Separate `<tbody>` elements
are allowed in the initial markup, but they do not define the groups; the
`data-table-sort-group` values on the rows or inherited from a body do.

As a shorthand, you can put `data-table-sort-group` on a `<tbody>` to give all
of its rows the same group:

```html
<tbody data-table-sort-group="engineering">
  <tr>
    <td>Charlie (Engineering)</td>
    <td>85</td>
  </tr>
  <tr>
    <td>Frank (Engineering)</td>
    <td>88</td>
  </tr>
</tbody>
```

A `data-table-sort-group` value directly on a `<tr>` overrides the value
inherited from its `<tbody>`. The component writes the effective group value to
each generated `<tbody>` so the grouping is preserved across subsequent sorts.

## Events

The component fires custom events that you can listen to:

| Event                 | Description                   | Detail                                                              |
| --------------------- | ----------------------------- | ------------------------------------------------------------------- |
| `table-sortable:sort` | Fired when a column is sorted | `{ column: number, direction: 'asc'\|'desc', header: HTMLElement }` |

### Example Event Handling

```javascript
const element = document.querySelector('table-sortable');

element.addEventListener('table-sortable:sort', (event) => {
  const { column, direction, header } = event.detail;
  const columnName = header.querySelector('button').textContent.trim();
  console.log(
    `Sorted column ${column} (${columnName}) in ${direction}ending order`,
  );
});
```

## Attributes

The component supports attributes for customizing sortable-button descriptions:

| Attribute          | Description                                          | Default                                      |
| ------------------ | ---------------------------------------------------- | -------------------------------------------- |
| `label-sortable`   | Accessible description for an unsorted column button | "Click to sort ascending"                    |
| `label-ascending`  | Accessible description when sorted ascending         | "sorted ascending. Click to sort descending" |
| `label-descending` | Accessible description when sorted descending        | "sorted descending. Click to sort ascending" |

Set labels before initialization. The reflected properties are
`labelSortable`, `labelAscending`, and `labelDescending`; each reads as
`string | null`. Assigning `null`, `undefined`, or `''` removes the attribute.
Missing or empty attributes use the English defaults above. Later attribute
or property changes don’t update the descriptions already rendered.

Cell keys (`data-sort-value` and `data-sort-as`) and row/body groups
(`data-table-sort-group`) belong on the nested table markup, not on the host.
An explicit cell value wins over an inline sort key, which leads the remaining
cell text. The component doesn’t generate a caption or region label; author
those in the table’s language too.

### Example Localization

```html
<table-sortable
  lang="fr"
  label-sortable="Cliquez pour trier par ordre croissant"
  label-ascending="trié croissant. Cliquez pour trier décroissant"
  label-descending="trié décroissant. Cliquez pour trier croissant"
>
  <table>
    <!-- table content -->
  </table>
</table-sortable>
```

## Styling

The component uses light DOM, so you can style the table normally with CSS. The component adds these classes to help style sort indicators:

| Class    | Applied To | Description                                      |
| -------- | ---------- | ------------------------------------------------ |
| `active` | `<th>`     | The currently sorted column                      |
| `up`     | `<th>`     | Column sorted in ascending order                 |
| `down`   | `<th>`     | Column sorted in descending order                |
| `sorted` | `<col>`    | The currently sorted column (for column styling) |

### CSS Custom Properties

The component supports CSS custom properties for visual indicators:

| Property                          | Description                | Default |
| --------------------------------- | -------------------------- | ------- |
| `--table-sortable-indicator-asc`  | Ascending sort indicator   | `↑`     |
| `--table-sortable-indicator-desc` | Descending sort indicator  | `↓`     |
| `--sort-indicator-asc`            | Legacy ascending fallback  | `↑`     |
| `--sort-indicator-desc`           | Legacy descending fallback | `↓`     |

The `--table-sortable-*` properties take precedence over their legacy
`--sort-indicator-*` counterparts. These values must be CSS strings, including
quotes. Decorative indicators use an empty CSS alternative; the button
description and `aria-sort` expose the state.

### Example Styling

```css
/* Customize sort indicators */
table-sortable {
  --table-sortable-indicator-asc: '▲';
  --table-sortable-indicator-desc: '▼';
}

table-sortable:not([hidden]) {
  display: block;
  max-inline-size: 100%;
  overflow-x: auto;
}

table {
  min-inline-size: 28rem;
  block-size: 1px;
  background: Canvas;
  color: CanvasText;
}

td {
  background: Canvas;
  color: CanvasText;
}

th {
  background-color: Canvas;
  background-image: linear-gradient(ButtonFace, ButtonFace);
  color: ButtonText;
}

thead th {
  padding: 0;
  block-size: 100%;
}

thead th button {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  inline-size: 100%;
  block-size: 100%;
  background: transparent;
  color: inherit;
  border: 0;
  border-radius: 0;
  padding: 0.5rem;
  font: inherit;
  cursor: pointer;
}

thead th[aria-sort='ascending'],
thead th[aria-sort='descending'] {
  background: CanvasText;
  color: Canvas;
}

/* Paint the cells, not a column hidden behind cell backgrounds. */
table:has(col:nth-child(1).sorted) tbody td:nth-child(1),
table:has(col:nth-child(2).sorted) tbody td:nth-child(2) {
  background: CanvasText;
  color: Canvas;
}
```

Extend the sorted-cell selectors for each additional column. Without `:has()`,
the table keeps readable cells and header indicators, but omits the column
fill. See [the shared demo table styles](./demo/tables.css) for four-column
selectors, neutral striping, group separators, and SVG masks that follow
`currentColor`. Browsers without mask support keep the text indicators; forced
colors use outlined/filled Unicode caret pairs instead.

The header button fills the cell without an inset border. The small specified
table height lets percentage-sized headers and buttons follow the row’s used
height. Table height is a minimum, so wrapped labels and data still expand
their rows. The browser’s focus indicator is retained.

The base component doesn’t assign text or surface colors. The demos pair
`CanvasText`/`Canvas` for reading, `ButtonText`/`ButtonFace` for headers, and
`FieldText`/`Field` for code and the event log. Translucent control and field
surfaces have an explicit `Canvas` backing. Supporting footer text uses an 80%
foreground mix on `Canvas`, with a full-strength fallback in forced colors and
increased contrast. Controls and data cells aren’t faded.

## Accessibility Features

The component is built with accessibility as a priority:

1. **Keyboard Navigation**:
   - All sortable headers are focusable with Tab
   - Activate sorting with `Enter` or `Space` keys

2. **Screen Reader Support**:
   - `aria-sort` attribute indicates column sort state (ascending, descending, none)
   - Sort buttons reference customizable descriptions for their current state and next action
   - Relies on native table and `aria-sort` support rather than adding a live region, avoiding duplicate announcements in browser and assistive-technology combinations that already report sort changes

3. **Progressive Enhancement**:
   - Leaves a native readable table before enhancement or when loading fails
   - Replaces header contents with native buttons; use plain text headers

4. **Visual Indicators**:
   - CSS classes indicate active column and sort direction
   - Demos preserve native keyboard focus indicators
   - Arrows and `aria-sort` convey direction independently of color
   - Group names and separators supplement decorative edge accents

Authors still need meaningful captions and column names, translated
descriptions, readable color pairs, and keyboard access to overflowing tables.
Sorting keeps the activated header button focused and moves the original data
rows. It doesn’t move focus to a newly sorted row or add a live announcement.
Test the complete authored table with your users’ browsers and assistive
technologies; automated checks don’t establish conformance.

Disconnecting cancels pending initialization and removes header-button
listeners. It doesn’t restore the original headers or body structure.
Reconnection initializes again; don’t rely on it to preserve enhanced header
contents or apply new labels safely.

## Column Highlighting

The component automatically injects `<colgroup>` and `<col>` elements if they don't exist, allowing you to style entire columns. The currently sorted column receives a `.sorted` class on its corresponding `<col>` element.

Opaque cell, row, and body backgrounds paint above column backgrounds. For
striped or grouped tables, pair foreground/background colors on the actual
sorted cells, as shown above, rather than relying on `col.sorted` alone.

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

# Install browser engines, then run browser regressions
npx playwright install chromium firefox webkit
npm run test:browser

# Lint code
npm run lint

# Format code
npm run format

# Serve the demos locally
node scripts/serve.js
# Open http://127.0.0.1:4181/demo/index.html
```

Browser tests cover the study’s 19 distinct palettes, native light/dark colors,
painted cell and control contrast, indicator hooks, keyboard sorting and
scrolling, localized descriptions, reflow, and no-JavaScript/module-failure
tables. CDN requests are intercepted with local source for regression tests.
The isolated version-helper test checks both displayed and executed ESM pins
without changing the real package version.

Palette substitution and Chromium forced-color emulation aren’t substitutes
for real Windows Contrast themes, Firefox custom colors, platform zoom, or
manual assistive-technology testing. The suite records the known Linux
WebKit native dark control-pair failure separately from the study palettes.

## License

MIT © [Aaron Gustafson](https://www.aaron-gustafson.com/)

Based on [jquery.easy-sortable-tables.js](https://github.com/easy-designs/jquery.easy-sortable-tables.js) © Aaron Gustafson
