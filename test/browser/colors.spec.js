import { readFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

const read = (path) =>
	readFile(new URL(`../../${path}`, import.meta.url), 'utf8');
const source = await read('table-sortable.js');
const definition = await read('define.js');
const tokens = [
	'Canvas',
	'CanvasText',
	'ButtonFace',
	'ButtonText',
	'Field',
	'FieldText',
];
// The study's 62 observations reduce to 19 palettes. Substitution is not OS repainting.
const palettes = [
	['#ffffff', '#000000', '#efefef', '#000000', '#ffffff', '#000000'],
	['#121212', '#ffffff', '#6b6b6b', '#ffffff', '#3b3b3b', '#ffffff'],
	['#ffffff', '#000000', '#e9e9ed', '#000000', '#ffffff', '#000000'],
	['#1c1b22', '#fbfbfe', '#2b2a33', '#fbfbfe', '#2b2a33', '#fbfbfe'],
	['#ffffff', '#000000', '#c0c0c0', '#000000d8', '#ffffff', '#000000d8'],
	['#1e1e1e', '#ffffff', '#ffffff3f', '#ffffffd8', '#ffffff3f', '#ffffffd8'],
	['#ffffff', '#000000', '#f0f0f0', '#000000', '#ffffff', '#000000'],
	['#202020', '#ffffff', '#202020', '#ffffff', '#202020', '#ffffff'],
	['#fffaef', '#3d3d3d', '#fffaef', '#202020', '#fffaef', '#3d3d3d'],
	['#2d3236', '#ffffff', '#2d3236', '#b6f6f0', '#2d3236', '#ffffff'],
	['#000000', '#ffffff', '#000000', '#ffee32', '#000000', '#ffffff'],
	['#000000', '#ffffff', '#000000', '#ffee32', '#000000', '#ffee32'],
	['#2d3236', '#ffffff', '#2d3236', '#b6f6f0', '#2d3236', '#b6f6f0'],
	['#fffaef', '#3d3d3d', '#fffaef', '#202020', '#fffaef', '#202020'],
	['#ffffff', '#000000', '#c0c0c0', '#000000', '#ffffff', '#000000'],
	['#000000', '#ffffff', '#c0c0c0', '#000000', '#ffffff', '#000000'],
	['#ffffff', '#000000', '#ffffff', '#000000d8', '#ffffff', '#000000d8'],
	['#282828', '#ffffff', '#202020', '#ffffff', '#202020', '#ffffff'],
	['#202020', '#ffffff', '#00000000', '#ffffff', '#00000000', '#ffffff'],
];

function substitute(css, palette) {
	const colors = Object.fromEntries(
		tokens.map((token, index) => [token, palette[index]]),
	);
	return css.replace(
		/\b(CanvasText|Canvas|ButtonFace|ButtonText|FieldText|Field)\b/g,
		(token) => colors[token],
	);
}

async function measurements(locator) {
	return locator.evaluate((element) => {
		const context = document.createElement('canvas').getContext('2d');
		if (!context) throw new Error('Canvas measurement unavailable.');
		const pixel = () => [...context.getImageData(0, 0, 1, 1).data];
		const paint = (color) => {
			context.fillStyle = color;
			context.fillRect(0, 0, 1, 1);
			return pixel();
		};
		const layer = (node) => {
			const style = getComputedStyle(node);
			if (style.opacity !== '1')
				throw new Error('Opacity requires group compositing.');
			paint(style.backgroundColor);
			if (style.backgroundImage !== 'none') {
				const wash = style.backgroundImage.match(
					/^linear-gradient\((.+), \1\)$/,
				);
				if (!wash)
					throw new Error(
						`Unsupported background: ${style.backgroundImage}`,
					);
				paint(wash[1]);
			}
		};
		const cell = element.closest('td, th');
		const background = (node) => {
			context.clearRect(0, 0, 1, 1);
			const ancestors = [];
			for (; node; node = node.parentElement) ancestors.unshift(node);
			for (const ancestor of ancestors) {
				layer(ancestor);
				if (
					ancestor.tagName === 'TABLE' &&
					cell?.closest('table') === ancestor
				) {
					if (cell.colSpan !== 1 || cell.rowSpan !== 1)
						throw new Error(
							'Spanning cells require a different column-painting fixture.',
						);
					const group = ancestor.querySelector('colgroup');
					if (group) {
						layer(group);
						const cols = [...group.children];
						if (cols.some((col) => col.span !== 1))
							throw new Error(
								'Spanning columns require a different fixture.',
							);
						if (cols[cell.cellIndex]) layer(cols[cell.cellIndex]);
					}
				}
			}
			if (pixel()[3] !== 255)
				throw new Error('Expected an opaque measurement surface.');
			return pixel();
		};
		const luminance = (rgb) =>
			rgb.slice(0, 3).reduce((sum, channel, index) => {
				const value = channel / 255;
				return (
					sum +
					(value <= 0.04045
						? value / 12.92
						: ((value + 0.055) / 1.055) ** 2.4) *
						[0.2126, 0.7152, 0.0722][index]
				);
			}, 0);
		const ratio = (a, b) => {
			const values = [luminance(a), luminance(b)].sort((a, b) => b - a);
			return (values[0] + 0.05) / (values[1] + 0.05);
		};
		const style = getComputedStyle(element);
		const fill = background(element);
		const foreground = paint(style.color);
		const surround = background(element.parentElement);
		background(element);
		const border = paint(style.borderTopColor);
		const paintsBorder =
			parseFloat(style.borderTopWidth) > 0 &&
			!['none', 'hidden'].includes(style.borderTopStyle);
		return {
			text: ratio(foreground, fill),
			boundary: Math.max(
				ratio(fill, surround),
				paintsBorder ? ratio(border, surround) : 1,
			),
		};
	});
}

async function demo(page, name = 'index.html') {
	await page.route('https://esm.sh/**', (route) =>
		route.fulfill({ contentType: 'text/javascript', body: source }),
	);
	await page.route('https://unpkg.com/**', (route) =>
		route.fulfill({
			contentType: 'text/javascript',
			body: definition.replace(
				"'./table-sortable.js'",
				"'http://127.0.0.1:4181/table-sortable.js'",
			),
		}),
	);
	await page.goto(`/demo/${name}`);
	await expect(
		page.locator('table-sortable').first().getByRole('button').first(),
	).toBeVisible();
}

test('all 19 palettes preserve ordinary, sorted and grouped cell contrast', async ({
	page,
}) => {
	test.setTimeout(60_000);
	await page.setViewportSize({ width: 1400, height: 900 });
	await demo(page);
	const originals = await page.evaluate(() =>
		[...document.styleSheets].map((sheet, index) => {
			const text = [...sheet.cssRules]
				.map((rule) => rule.cssText)
				.join('\n');
			const replacement = document.createElement('style');
			replacement.dataset.paletteIndex = index;
			sheet.ownerNode.replaceWith(replacement);
			return text;
		}),
	);
	for (const [index, palette] of palettes.entries()) {
		for (const [sheet, css] of originals.entries()) {
			await page.locator(`style[data-palette-index="${sheet}"]`).evaluate(
				(style, css) => {
					style.textContent = css;
				},
				substitute(css, palette),
			);
		}
		for (const selector of [
			'.demo-section',
			'.note',
			'.api-reference',
			'pre',
			'footer',
			'#event-log',
		]) {
			expect(
				(await measurements(page.locator(selector).first())).text,
				`${index}: ${selector}`,
			).toBeGreaterThanOrEqual(4.5);
		}
		for (const host of await page.locator('table-sortable').all()) {
			const button = host.locator('thead button').first();
			for (let direction = 0; direction < 2; direction++) {
				await button.evaluate((button) => button.click());
				const control = await measurements(button);
				expect(control.text, `${index}: header`).toBeGreaterThanOrEqual(
					4.5,
				);
				const header = await measurements(button.locator('..'));
				expect(header.boundary).toBeGreaterThanOrEqual(3);
				for (const cell of await host
					.locator(
						'tbody tr:first-child > td, tbody tr:nth-child(2) > td',
					)
					.all()) {
					expect(
						(await measurements(cell)).text,
						`${index}: sorted/striped cell`,
					).toBeGreaterThanOrEqual(4.5);
				}
			}
		}
		const hovered = page.locator('thead button').first();
		await hovered.hover();
		expect((await measurements(hovered)).text).toBeGreaterThanOrEqual(4.5);
	}
});

for (const colorScheme of ['light', 'dark']) {
	test(`${colorScheme}: table text, sorted cells and footer retain contrast`, async ({
		page,
	}) => {
		await page.emulateMedia({ colorScheme });
		await demo(page);
		const table = page.locator('table-sortable').first();
		await table.getByRole('button', { name: 'Name', exact: true }).click();
		for (const cell of await table.locator('tbody td').all())
			expect((await measurements(cell)).text).toBeGreaterThanOrEqual(4.5);
		expect(
			(await measurements(page.locator('footer'))).text,
		).toBeGreaterThanOrEqual(4.5);
	});
	test(`${colorScheme}: native control pair is measured separately`, async ({
		page,
		browserName,
	}) => {
		test.fail(
			browserName === 'webkit' &&
				process.platform === 'linux' &&
				colorScheme === 'dark',
			'Bundled Linux WebKit native dark ButtonText/ButtonFace pair.',
		);
		await page.emulateMedia({ colorScheme });
		await demo(page);
		expect(
			(await measurements(page.locator('thead button').first())).text,
		).toBeGreaterThanOrEqual(4.5);
	});
}

test('documented indicator hooks work without demo CSS and retain legacy fallbacks', async ({
	page,
}) => {
	await page.route('**/fixture.html', (route) =>
		route.fulfill({
			contentType: 'text/html',
			body: '<!doctype html><table-sortable><table><thead><tr><th>Name</th></tr></thead><tbody><tr><td>Alice</td></tr></tbody></table></table-sortable><script type="module" src="/define.js"></script>',
		}),
	);
	await page.goto('/fixture.html');
	const host = page.locator('table-sortable');
	await host.evaluate((host) => {
		host.style.setProperty('--table-sortable-indicator-asc', '"ASC"');
		host.style.setProperty('--table-sortable-indicator-desc', '"DESC"');
		host.style.setProperty('--sort-indicator-asc', '"OLD-ASC"');
		host.style.setProperty('--sort-indicator-desc', '"OLD-DESC"');
	});
	const button = host.getByRole('button');
	await button.click();
	expect(
		await button.evaluate(
			(button) => getComputedStyle(button, '::after').content,
		),
	).toContain('"ASC"');
	await button.click();
	expect(
		await button.evaluate(
			(button) => getComputedStyle(button, '::after').content,
		),
	).toContain('"DESC"');
	await host.evaluate((host) => {
		host.style.removeProperty('--table-sortable-indicator-asc');
		host.style.removeProperty('--table-sortable-indicator-desc');
	});
	await button.click();
	expect(
		await button.evaluate(
			(button) => getComputedStyle(button, '::after').content,
		),
	).toContain('OLD-ASC');
	await button.click();
	expect(
		await button.evaluate(
			(button) => getComputedStyle(button, '::after').content,
		),
	).toContain('OLD-DESC');
});

test('SVG caret masks follow the button foreground in both directions', async ({
	page,
}) => {
	await demo(page);
	const button = page
		.locator('table-sortable.svg-sort-indicators')
		.getByRole('button')
		.first();
	for (const expected of ['none', 'ascending', 'descending']) {
		await expect(button.locator('..')).toHaveAttribute(
			'aria-sort',
			expected,
		);
		const styles = await button.evaluate((button) => {
			const pseudo = getComputedStyle(button, '::after');
			return {
				mask: pseudo.maskImage,
				fill: pseudo.backgroundColor,
				foreground: getComputedStyle(button).color,
			};
		});
		expect(styles.mask).not.toBe('none');
		expect(styles.fill).toBe(styles.foreground);
		const paintedPixels = await button.evaluate(async (button) => {
			const mask = getComputedStyle(button, '::after').maskImage;
			const url = mask.match(/^url\("(.*)"\)$/);
			if (!url) throw new Error(`Unexpected mask URL: ${mask}`);
			const image = new Image();
			image.src = url[1];
			await image.decode();
			const canvas = document.createElement('canvas');
			canvas.width = 16;
			canvas.height = 24;
			const context = canvas.getContext('2d');
			if (!context) throw new Error('Canvas measurement unavailable.');
			context.drawImage(image, 0, 0, 16, 24);
			return context
				.getImageData(0, 0, 16, 24)
				.data.filter((value, index) => index % 4 === 3 && value > 0)
				.length;
		});
		expect(paintedPixels).toBeGreaterThan(0);
		expect(paintedPixels).toBeLessThan(16 * 24);
		await button.click();
	}
});

for (const fontSize of [100, 200]) {
	test(`${fontSize}%: flat sort buttons cover the full header cell, including wrapped rows and edge clicks`, async ({
		page,
	}) => {
		await page.setViewportSize({ width: 320, height: 900 });
		await demo(page);
		await page.addStyleTag({
			content: `:root { font-size: ${fontSize}%; }`,
		});
		const host = page.locator('table-sortable').first();
		const buttons = host.locator('thead button');
		const initialHeight = await host
			.locator('thead')
			.evaluate((head) => head.getBoundingClientRect().height);
		await buttons.last().evaluate((button) => {
			button.textContent = 'A longer occupation header';
		});
		expect(
			await host
				.locator('thead')
				.evaluate((head) => head.getBoundingClientRect().height),
		).toBeGreaterThan(initialHeight);
		for (const button of await buttons.all()) {
			await expect(button).toHaveCSS('border-top-width', '0px');
			const geometry = await button.evaluate((button) => {
				const cell = button.closest('th');
				const a = button.getBoundingClientRect();
				const b = cell.getBoundingClientRect();
				const style = getComputedStyle(cell);
				return {
					padding: style.paddingTop,
					widthGap: b.width - a.width,
					heightGap: b.height - a.height,
					contentOverflow: button.scrollHeight - button.clientHeight,
				};
			});
			expect(geometry.padding).toBe('0px');
			expect(geometry.widthGap).toBeLessThanOrEqual(2);
			expect(geometry.heightGap).toBeLessThanOrEqual(2);
			expect(geometry.contentOverflow).toBeLessThanOrEqual(1);
			await button.click({ position: { x: 2, y: 2 } });
			await expect(button.locator('..')).toHaveAttribute(
				'aria-sort',
				'ascending',
			);
			const next = await button.boundingBox();
			await button.click({
				position: { x: next.width - 2, y: next.height - 2 },
			});
			await expect(button.locator('..')).toHaveAttribute(
				'aria-sort',
				'descending',
			);
		}
	});
}

test('native keyboard sorting retains names, focus, row nodes and correct numeric order', async ({
	page,
	browserName,
}) => {
	await demo(page);
	const host = page.locator('table-sortable').first();
	await host.evaluate((host) => {
		window.sortableOriginalRows = [...host.querySelectorAll('tbody tr')];
	});
	const button = host.getByRole('button', { name: 'Age', exact: true });
	await button.focus();
	await page.keyboard.press('Enter');
	await expect(button).toBeFocused();
	await expect(button).toHaveAccessibleName('Age');
	await expect(button.locator('..')).toHaveAttribute(
		'aria-sort',
		'ascending',
	);
	expect(
		await host.locator('tbody tr td:nth-child(2)').allTextContents(),
	).toEqual(['26', '28', '31', '35', '42']);
	await page.keyboard.press('Space');
	await expect(button.locator('..')).toHaveAttribute(
		'aria-sort',
		'descending',
	);
	expect(
		await host.locator('tbody tr td:nth-child(2)').allTextContents(),
	).toEqual(['42', '35', '31', '28', '26']);
	expect(
		await host.evaluate((host) =>
			window.sortableOriginalRows.every(
				(row) => row.isConnected && host.contains(row),
			),
		),
	).toBe(true);
	await page.keyboard.press(
		browserName === 'webkit' && process.platform === 'darwin'
			? 'Alt+Tab'
			: 'Tab',
	);
	await expect(
		host.getByRole('button', { name: 'City', exact: true }),
	).toBeFocused();
	await expect(
		host.getByRole('button', { name: 'City', exact: true }),
	).toHaveCSS('outline-style', 'auto');
});

test('group membership, inline keys and localized state descriptions survive sorting', async ({
	page,
}) => {
	await demo(page);
	const group = page.locator('table-sortable:has(.grouped-table)');
	await group.getByRole('button', { name: 'Score', exact: true }).click();
	expect(await group.locator('tbody').count()).toBe(4);
	for (const body of await group.locator('tbody').all()) {
		const key = await body.getAttribute('data-table-sort-group');
		expect(
			await body
				.locator('tr')
				.evaluateAll((rows) => [
					...new Set(rows.map((row) => row.dataset.tableSortGroup)),
				]),
		).toEqual([key]);
	}
	const names = page.locator('table-sortable:has([data-sort-as])');
	await names.getByRole('button', { name: 'Full Name', exact: true }).click();
	expect(
		await names.locator('tbody [data-sort-as]').allTextContents(),
	).toEqual(['Anderson', 'Brown', 'Smith', 'Zhang']);
	const french = page.locator('table-sortable[label-sortable]');
	await expect(french).toHaveAttribute('lang', 'fr');
	const age = french.getByRole('button', { name: 'Âge', exact: true });
	await expect(age).toHaveAccessibleDescription(
		'Cliquer pour trier par ordre croissant',
	);
	await age.click();
	await expect(age).toHaveAccessibleDescription(
		'trié croissant. Cliquer pour trier décroissant',
	);
	await expect(age).toHaveAccessibleName('Âge');
	await age.click();
	await expect(age).toHaveAccessibleDescription(
		'trié décroissant. Cliquer pour trier croissant',
	);
});

test('event log uses only the visible column name and renders untrusted text literally', async ({
	page,
}) => {
	await demo(page);
	const host = page.locator('#event-demo');
	const button = host.locator('thead button').first();
	await expect(button).toHaveAccessibleName('Name');
	await button.click();
	await expect(page.locator('#event-messages')).toContainText(
		'Sorted by "Name"',
	);
	await expect(page.locator('#event-messages')).not.toContainText(
		'Click to sort',
	);
	await button.evaluate((button) => {
		button.textContent = '<img src=x onerror=alert(1)>';
	});
	await button.click();
	await expect(page.locator('#event-messages')).toContainText(
		'<img src=x onerror=alert(1)>',
	);
	await expect(page.locator('#event-messages img')).toHaveCount(0);
	for (let index = 0; index < 5; index++) await button.click();
	await expect(page.locator('#event-messages > div')).toHaveCount(5);
});

test('forced colors retain shape indicators and native focus', async ({
	page,
	browserName,
}) => {
	test.skip(
		browserName !== 'chromium',
		'Forced-color emulation is Chromium-only.',
	);
	await page.emulateMedia({ forcedColors: 'active' });
	await demo(page);
	const host = page.locator('table-sortable').first();
	const button = host.getByRole('button', { name: 'Name', exact: true });
	await button.focus();
	await page.keyboard.press('Enter');
	const active = await button.evaluate(
		(button) => getComputedStyle(button, '::after').content,
	);
	expect(active).toContain('▲');
	await page.keyboard.press('Space');
	expect(
		await button.evaluate(
			(button) => getComputedStyle(button, '::after').content,
		),
	).toContain('▼');
	await expect(button).toHaveCSS('forced-color-adjust', 'auto');
	await expect(button).toHaveCSS('outline-style', 'auto');
});

test('increased contrast restores full-strength supporting text', async ({
	page,
}) => {
	await page.emulateMedia({ contrast: 'more' });
	await demo(page);
	const color = await page
		.locator('body')
		.evaluate((element) => getComputedStyle(element).color);
	await expect(page.locator('footer')).toHaveCSS('color', color);
});

for (const name of ['index.html', 'esm.html', 'unpkg.html']) {
	test(`${name}: code/live pairs and keyboard-scrollable tables reflow without losing data`, async ({
		page,
	}) => {
		await demo(page, name);
		for (const pair of await page.locator('.code-demo-pair').all()) {
			await expect(pair.locator(':scope > *')).toHaveCount(2);
			await expect(pair.locator(':scope > pre')).toHaveCount(1);
			await expect(pair.locator(':scope > .demo')).toHaveCount(1);
		}
		for (const width of [1400, 1024, 768, 320]) {
			await page.setViewportSize({ width, height: 900 });
			if (width === 1400) {
				for (const host of await page.locator('table-sortable').all()) {
					expect(
						await host.evaluate((host) => host.clientWidth),
					).toBeGreaterThanOrEqual(320);
				}
			}
			await expect(page.locator('.code-demo-pair').first()).toHaveCSS(
				'flex-direction',
				width < 768 ? 'column' : 'row',
			);
			expect(
				await page.evaluate(
					() => document.documentElement.scrollWidth > innerWidth,
				),
			).toBe(false);
		}
		await page.addStyleTag({ content: ':root { font-size: 200%; }' });
		expect(
			await page.evaluate(
				() => document.documentElement.scrollWidth > innerWidth,
			),
		).toBe(false);
		for (const host of await page.locator('table-sortable').all()) {
			await expect(host).toHaveAttribute('tabindex', '0');
			await expect(host).toHaveAttribute('role', 'region');
			await expect(host).toHaveAccessibleName(/.+/);
			await expect(host.locator('caption')).toBeVisible();
			expect(
				await host.evaluate(
					(host) => host.scrollWidth > host.clientWidth,
				),
			).toBe(true);
		}
		const host = page.locator('table-sortable').first();
		await host.scrollIntoViewIfNeeded();
		await host.focus();
		await expect(host).toBeFocused();
		await page.keyboard.press('ArrowRight', { delay: 100 });
		await expect
			.poll(() => host.evaluate((host) => host.scrollLeft))
			.toBeGreaterThan(0);
	});
	for (const failure of ['no JavaScript', 'module failure']) {
		test(`${name}: ${failure} retains captioned native tables and every data cell`, async ({
			browser,
		}) => {
			const context = await browser.newContext({
				javaScriptEnabled: failure !== 'no JavaScript',
				viewport: { width: 320, height: 900 },
			});
			try {
				const page = await context.newPage();
				await page.route(/(\.js(\?|$)|esm\.sh|unpkg\.com)/, (route) =>
					route.abort(),
				);
				await page.goto(`http://127.0.0.1:4181/demo/${name}`);
				await expect(page.locator('table-sortable button')).toHaveCount(
					0,
				);
				await expect(page.locator('caption').first()).toBeVisible();
				expect(await page.locator('tbody td').count()).toBeGreaterThan(
					8,
				);
				await expect(
					page.locator('table').first(),
				).toHaveAccessibleName(/.+/);
				expect(
					await page.evaluate(
						() => document.documentElement.scrollWidth > innerWidth,
					),
				).toBe(false);
			} finally {
				await context.close();
			}
		});
	}
}
