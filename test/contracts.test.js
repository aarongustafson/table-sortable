import { readFile } from 'node:fs/promises';
import { expect, it } from 'vitest';
import { lexer } from 'marked';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

it('describes the real host properties, indicator hooks and registration exports', async () => {
	const manifest = JSON.parse(await read('../custom-elements.json'));
	const component = manifest.modules.find(
		(entry) => entry.path === 'table-sortable.js',
	).declarations[0];
	expect(component.attributes.map((entry) => entry.name)).toEqual([
		'label-sortable',
		'label-ascending',
		'label-descending',
	]);
	const types = await read('../table-sortable.d.ts');
	for (const property of [
		'labelSortable',
		'labelAscending',
		'labelDescending',
	]) {
		expect(
			component.members.find((entry) => entry.name === property).type
				.text,
		).toBe('string | null');
		expect(types).toContain(`${property}: string | null`);
	}
	expect(component.cssProperties.map((entry) => entry.name)).toEqual([
		'--table-sortable-indicator-asc',
		'--table-sortable-indicator-desc',
		'--sort-indicator-asc',
		'--sort-indicator-desc',
	]);
	expect(component.events[0].name).toBe('table-sortable:sort');
	expect(component.superclass.name).toBe('HTMLElement');
	expect(component.slots || []).toEqual([]);
	const helper = manifest.modules.find((entry) => entry.path === 'define.js');
	expect(helper.exports.map((entry) => entry.name)).toContain(
		'defineTableSortable',
	);
	expect(await read('../define.d.ts')).toContain('defineTableSortable');
});

it('does not replace package documentation with a README filename override', async () => {
	const manifest = JSON.parse(await read('../custom-elements.json'));
	expect(manifest).not.toHaveProperty('readme');
});

it('renders a complete three-column CSS property reference', async () => {
	const tables = lexer(await read('../README.md')).filter(
		(token) => token.type === 'table',
	);
	const table = tables.find((token) => token.header[0].text === 'Property');
	expect(table).toBeDefined();
	expect(table.header).toHaveLength(3);
	expect(
		table.rows
			.flat()
			.map((cell) => cell.text)
			.join(' '),
	).toContain('--table-sortable-indicator-asc');
	for (const row of table.rows) expect(row).toHaveLength(3);
});
