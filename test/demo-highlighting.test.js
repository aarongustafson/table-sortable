import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { expect, it } from 'vitest';

const component = JSON.parse(await readFile('package.json', 'utf8'))
	.name.split('/')
	.pop();
const releasePages = ['esm.html'];
const version = new RegExp(
	`(https://esm\\.sh/@aarongustafson/${component}@)\\d+\\.\\d+\\.\\d+(?=/)`,
	'g',
);
const normalize = (text, name) =>
	releasePages.includes(name) ? text.replace(version, '$1VERSION') : text;
const digest = (text, name) =>
	createHash('sha256').update(normalize(text, name)).digest('hex');
const directory = `${process.cwd()}/demo/`;
const pages = (await readdir(directory))
	.filter((name) => name.endsWith('.html'))
	.sort();
const snippets = [];
for (const name of pages) {
	const template = document.createElement('template');
	template.innerHTML = await readFile(`${directory}${name}`, 'utf8');
	for (const code of template.content.querySelectorAll('pre code'))
		snippets.push({ name, code });
}

it('preserves displayed code apart from release-managed CDN versions', () => {
	expect(
		snippets.map(({ name, code }) => [
			name,
			digest(code.textContent, name),
		]),
	).toMatchSnapshot();
});

it('allows future release-managed CDN versions but preserves all other text', () => {
	const current = `https://esm.sh/@aarongustafson/${component}@1.2.3/define.js`;
	const future = current.replace('@1.2.3/', '@9.8.7/');
	expect(digest(future, 'esm.html')).toBe(digest(current, 'esm.html'));
	expect(digest(`${future}?changed`, 'esm.html')).not.toBe(
		digest(current, 'esm.html'),
	);
	expect(normalize(current, 'index.html')).toBe(current);
	const unrelated =
		'https://esm.sh/@aarongustafson/other-component@1.2.3/define.js 1.2.3';
	expect(normalize(unrelated, 'esm.html')).toBe(unrelated);
});

it('marks each component tag, API attribute, import, and registration without nesting', () => {
	for (const { name, code } of snippets) {
		expect(code.querySelector('mark mark'), name).toBeNull();
		for (const mark of code.querySelectorAll('mark'))
			expect(mark.textContent, name).not.toMatch(
				/<\/?(?:script|style|video|table|tr|td|h[1-6]|p|span|label|input)(?=[\s>])/,
			);
		const covered = [];
		let offset = 0;
		const walk = (node) => {
			if (node.nodeType === 3) {
				for (let index = 0; index < node.textContent.length; index++) {
					covered[offset++] = Boolean(
						node.parentElement.closest('mark'),
					);
				}
			} else {
				for (const child of node.childNodes) walk(child);
			}
		};
		walk(code);
		const patterns = [
			new RegExp(`<\\/?${component}\\b[^>]*>`, 'g'),
			new RegExp(`['"]${component}:[\\w-]+['"]`, 'g'),
			/\bevent\.detail\b/g,
			/\bimport\s+(?!map)[^;]+;/g,
			/\b(?:customElements\.define|define[A-Z]\w*)\([^;]+;/g,
			/\bdata-(?:tab-short-name|sort-value|sort-as|table-sort-group)(?:="[^"]*")?/g,
		];
		for (const pattern of patterns) {
			for (const match of code.textContent.matchAll(pattern)) {
				expect(
					covered
						.slice(match.index, match.index + match[0].length)
						.every(Boolean),
					`${name}: ${match[0]}`,
				).toBe(true);
			}
		}
	}
});
