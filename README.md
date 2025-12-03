# table-sortable Web Component

[![npm version](https://img.shields.io/npm/v/@aarongustafson/table-sortable.svg)](https://www.npmjs.com/package/@aarongustafson/table-sortable) [![Build Status](https://img.shields.io/github/actions/workflow/status/aarongustafson/table-sortable/ci.yml?branch=main)](https://github.com/aarongustafson/table-sortable/actions)

A web component to enable users to sort the data in a table based on table cell values.

## Demo

[Live Demo](https://aarongustafson.github.io/table-sortable/demo/) ([Source](./demo/index.html))

## Installation

```bash
npm install @aarongustafson/table-sortable
```

## Usage

### Option 1: Auto-define the custom element (easiest)

Import the package to automatically define the `<table-sortable>` custom element:

```javascript
import '@aarongustafson/table-sortable';
```

Or use the define-only script in HTML:

```html
<script src="./node_modules/@aarongustafson/table-sortable/define.js" type="module"></script>
```

### Option 2: Import the class and define manually

Import the class and define the custom element with your preferred tag name:

```javascript
import { TableSortableElement } from '@aarongustafson/table-sortable/table-sortable.js';

customElements.define('my-custom-name', TableSortableElement);
```

### Basic Example

```html
<table-sortable>
  <!-- Your content here -->
</table-sortable>
```

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `example-attribute` | `string` | `""` | Description of the attribute |

## Events

The component fires custom events that you can listen to:

| Event | Description | Detail |
|-------|-------------|--------|
| `table-sortable:event` | Fired when something happens | `{ data }` |

### Example Event Handling

```javascript
const element = document.querySelector('table-sortable');

element.addEventListener('table-sortable:event', (event) => {
  console.log('Event fired:', event.detail);
});
```

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--example-color` | `#000` | Example color property |

### Example Styling

```css
table-sortable {
  --example-color: #ff0000;
}
```

## Browser Support

This component uses modern web standards:
- Custom Elements v1
- Shadow DOM v1
- ES Modules

For older browsers, you may need polyfills.

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format

# View demo
open demo/index.html
```

## License

MIT © [Aaron Gustafson](https://www.aaron-gustafson.com/)
