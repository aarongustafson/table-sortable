# table-sortable Web Component

[![npm version](https://img.shields.io/npm/v/@aarongustafson/table-sortable.svg)](https://www.npmjs.com/package/@aarongustafson/table-sortable)
[![CI status](https://img.shields.io/github/actions/workflow/status/aarongustafson/table-sortable/ci.yml?branch=main&label=CI)](https://github.com/aarongustafson/table-sortable/actions/workflows/ci.yml)
[![Minified + gzipped size](https://img.shields.io/bundlejs/size/@aarongustafson/table-sortable?format=minzip&label=min%2Bgzip)](https://bundlejs.com/?q=@aarongustafson/table-sortable)
[![License](https://img.shields.io/npm/l/@aarongustafson/table-sortable)](https://github.com/aarongustafson/table-sortable/blob/main/LICENSE)
[![Type definitions](https://img.shields.io/npm/types/@aarongustafson/table-sortable)](https://github.com/aarongustafson/table-sortable/blob/main/table-sortable.d.ts)

`<table-sortable>` adds native sort buttons to a table’s column headers.
Readers can sort with a click, Enter, or Space. Without JavaScript, the table
remains readable in its authored order.

Use plain-text headers and a regular table with one header row and matching
data columns. The component works in light DOM and has no runtime dependencies.

## Demo

- [Full Demo](https://aarongustafson.github.io/table-sortable/demo/) ([Source](./demo/index.html))
- [unpkg CDN Demo](https://aarongustafson.github.io/table-sortable/demo/unpkg.html) ([Source](./demo/unpkg.html))
- [esm.sh CDN Demo](https://aarongustafson.github.io/table-sortable/demo/esm.html) ([Source](./demo/esm.html))

The full demo includes [custom keys](https://aarongustafson.github.io/table-sortable/demo/#product-pricing),
[department groups](https://aarongustafson.github.io/table-sortable/demo/#department-groups),
[French labels](https://aarongustafson.github.io/table-sortable/demo/#french-table),
and [SVG carets](https://aarongustafson.github.io/table-sortable/demo/#svg-caret-table).

## Installation

```bash
npm install @aarongustafson/table-sortable
```

## Usage

> **TypeScript ready**
>
> The package ships with `table-sortable.d.ts`, including the sort-event
> payload and the three reflected label properties.

### Option 1: Import the class and define manually

The main import exports the class without registering it:

```javascript
import { TableSortableElement } from '@aarongustafson/table-sortable';

customElements.define('table-sortable', TableSortableElement);
```

You can choose another tag name, but the shared indicator and visually hidden description styles target
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

After registering the component, wrap a captioned table in `<table-sortable>`:

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

After registration, initialization runs in an animation frame. The component
enhances the first nested table. If there isn’t a table at initialization,
it logs a warning; it doesn’t watch for one to be added later.

The component replaces every `<thead>` header’s contents with a button using
that header’s trimmed text. Use plain text, not links, buttons, or markup you
need to preserve. Supply a `<thead>` with one row of `<th>` elements and
matching cells in each `<tbody>` row. It sorts by cell position, not a
`colspan`/`rowspan` grid, so avoid spanning cells in sortable data.

The named, focusable region is authored markup, not something the component
adds. With the overflow styles below, keyboard users can focus that region and
scroll a wide table without losing columns.

## Sorting Behavior

- Activating a column sorts ascending. Activating the same column again toggles
  descending; switching columns starts ascending again.
- Plain cell text is trimmed and compared in uppercase. This is not
  locale-aware collation.
- Numeric keys use numeric comparison, so `20` comes before `100`.
  Currency symbols, thousands separators, and localized decimals are not
  numeric keys; supply an unformatted `data-sort-value` for them.
- Use consistent key types within a column. Mixed numbers and nonnumeric text
  don’t have a defined “numbers first” order.
- Sorting moves the original row nodes, preserving their content and listeners.
  It replaces **all** body containers, even without groups: arbitrary
  `<tbody>` attributes, IDs, classes, and listeners are not retained.
- Header buttons stay in place, and the activated button keeps focus. Sorting
  doesn’t offer a third, original-order state.

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
- Priority order, using numeric keys such as `1`, `2`, and `3`

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

Key precedence is:

1. A cell’s `data-sort-value`, including an empty value, wins. Text keys are
   compared as supplied; use consistent case.
2. Otherwise, the first descendant with `data-sort-as` supplies the leading
   text, followed by the remaining cell text. Both parts are trimmed and
   uppercased.
3. Otherwise, the component uses the cell’s trimmed, uppercased text.

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

Rows with the same effective group value stay together. Rows within each
group follow the selected sort direction. Groups appear in the order their
first row occurs in the sorted sequence—not alphabetically by the group key.
For example, sorting Score ascending puts the group with the lowest score
first, then keeps its other rows beside it.

Use a normal `<tbody>` around the table’s data rows, as shown above. You don’t
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
inherited from its `<tbody>`, including when the row’s value is empty. Empty
strings form a group; rows without either attribute form a separate unkeyed
group when keyed groups exist. Effective group keys survive subsequent sorts,
but other body attributes don’t.

## Events

The component dispatches a bubbling event on the host after sorting:

| Event                 | Description              | Detail                                                              |
| --------------------- | ------------------------ | ------------------------------------------------------------------- |
| `table-sortable:sort` | A column has been sorted | `{ column: number, direction: 'asc'\|'desc', header: HTMLElement }` |

`column` is zero-based, and `header` is the active `<th>`. There’s no public
sorting method; use the header buttons. See the
[visible event example](https://aarongustafson.github.io/table-sortable/demo/#sort-event-listener).

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
The component doesn’t generate a caption or region label; author those in the
table’s language too.

Use the labels to match your application’s vocabulary or translate the
descriptions. `lang` alone doesn’t translate them.

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

The component supplies a `<colgroup>` with one `<col>` per header column if
there isn’t one. If you author a `<colgroup>`, provide a `<col>` for each
column. Opaque cell, row, and body backgrounds paint over column backgrounds;
use the sorted-cell selectors below rather than relying on `col.sorted` alone.

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

The button fills the header cell; wrapped labels and data still expand the
rows. Keep the browser’s focus indicator visible. The base component doesn’t
assign text or surface colors; the example pairs system foreground and
background colors and paints an opaque backing beneath the header gradient.

## Keyboard and Assistive Technology

1. **Keyboard Navigation**:
   - All sortable headers are focusable with Tab
   - Activate sorting with `Enter` or `Space` keys

2. **Screen Reader Support**:
   - `aria-sort` on each header indicates its state: `ascending`, `descending`, or `none`
   - Sort buttons reference customizable descriptions for their current state and next action
   - Relies on native table and `aria-sort` support rather than adding a live region, avoiding duplicate announcements in browser and assistive-technology combinations that already report sort changes

3. **Visual Indicators**:
   - CSS classes indicate active column and sort direction
   - Demos preserve native keyboard focus indicators
   - Arrows and `aria-sort` convey direction independently of color
   - Group names and separators supplement decorative edge accents

Authors still need meaningful captions and column names, translated
descriptions, readable color pairs, and keyboard access to overflowing tables.
Sorting doesn’t move focus to a data row or add a live announcement.
Test the complete authored table with your users’ browsers and assistive
technologies; automated checks don’t establish conformance.

### Disconnecting and Reconnecting

Disconnecting cancels pending initialization and removes header-button
listeners. It doesn’t restore the original headers or body structure.
Reconnection initializes again; don’t rely on it to preserve enhanced header
contents or apply new labels safely.

## Browser Support

This component uses modern web standards:

- Custom Elements v1
- ES Modules
- ES6+ JavaScript features

The browser suite runs in Playwright’s Chromium, Firefox, and WebKit engines.
It doesn’t establish minimum Chrome, Edge, Firefox, or Safari release versions.
The demo’s optional `:has()`, color mixing, and SVG masks have readable
fallbacks; test the styles and indicators in the browsers you support.

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
