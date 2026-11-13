import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { test, expect } from '@playwright/test';

test('highlighted examples retain contrast, reflow, and native focus', async ({
	page,
}) => {
	const root = process.cwd();
	await page.route('**/*', async (route) => {
		const url = new URL(route.request().url());
		const path = resolve(root, `.${url.pathname}`);
		if (
			url.hostname !== 'highlight.test' ||
			!path.startsWith(`${root}${sep}`)
		)
			return route.abort();
		try {
			await route.fulfill({
				body: await readFile(path),
				contentType:
					{
						'.html': 'text/html',
						'.css': 'text/css',
						'.js': 'text/javascript',
						'.svg': 'image/svg+xml',
					}[extname(path)] || 'application/octet-stream',
			});
		} catch {
			await route.abort();
		}
	});
	for (const media of [
		{ colorScheme: 'light' },
		{ colorScheme: 'dark' },
		{ forcedColors: 'active' },
	]) {
		await page.emulateMedia(media);
		for (const name of ['index', 'esm', 'unpkg']) {
			await page.setViewportSize({ width: 1280, height: 900 });
			await page.goto(`http://highlight.test/demo/${name}.html`);
			const marks = page.locator('pre code mark');
			expect(await marks.count()).toBeGreaterThan(0);
			await expect(page.locator('mark mark')).toHaveCount(0);
			const contrast = await marks.evaluateAll((elements) => {
				const luminance = (color) =>
					color
						.match(/[\d.]+/g)
						.slice(0, 3)
						.reduce((sum, channel, index) => {
							const value = Number(channel) / 255;
							return (
								sum +
								(value <= 0.04045
									? value / 12.92
									: ((value + 0.055) / 1.055) ** 2.4) *
									[0.2126, 0.7152, 0.0722][index]
							);
						}, 0);
				return elements.map((element) => {
					const style = getComputedStyle(element);
					const values = [
						luminance(style.color),
						luminance(style.backgroundColor),
					].sort((a, b) => a - b);
					return (values[1] + 0.05) / (values[0] + 0.05);
				});
			});
			expect(Math.min(...contrast)).toBeGreaterThanOrEqual(4.5);
			await page.setViewportSize({ width: 320, height: 900 });
			for (const pre of await page.locator('pre').all()) {
				expect(
					await pre.evaluate(
						(element) =>
							element.getBoundingClientRect().right <=
							innerWidth + 1,
					),
				).toBe(true);
				if ((await pre.getAttribute('tabindex')) === '0') {
					await pre.focus();
					await expect(pre).toBeFocused();
					expect(
						await pre.evaluate(
							(element) => getComputedStyle(element).outlineStyle,
						),
					).not.toBe('none');
					if (
						await pre.evaluate(
							(element) =>
								element.scrollWidth > element.clientWidth,
						)
					) {
						await pre.press('ArrowRight');
						await expect
							.poll(() =>
								pre.evaluate((element) => element.scrollLeft),
							)
							.toBeGreaterThan(0);
					}
				}
			}
			await expect(
				page.locator('mark[tabindex], mark[role]'),
			).toHaveCount(0);
		}
	}
});
