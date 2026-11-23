import { expect, test } from '@playwright/test';

for (const name of ['index', 'esm', 'unpkg']) {
	test(`${name}: every individual example has a unique, navigable fragment`, async ({
		page,
	}) => {
		// Fragment destinations and native fallback don't depend on either CDN.
		await page.route('https://**/*', (route) => route.abort());
		await page.goto(`/demo/${name}.html`);
		const examples = await page
			.locator('.code-demo-pair')
			.evaluateAll((pairs) =>
				pairs.map((pair) => {
					const block = pair.closest('.demo-section');
					return {
						id: block?.id,
						hasHeading: Boolean(block?.querySelector('h2, h3')),
						pairs: block?.querySelectorAll('.code-demo-pair')
							.length,
					};
				}),
			);
		expect(examples.length).toBeGreaterThan(0);
		for (const example of examples) {
			expect(
				example.id,
				'Link to the individual example, not its group',
			).toMatch(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)+$/);
			expect(example.hasHeading).toBe(true);
			expect(example.pairs).toBe(1);
			const destination = page.locator(`[id="${example.id}"]`);
			await expect(destination).toHaveCount(1);
			await page.goto(`/demo/${name}.html#${example.id}`);
			await expect(destination).toBeInViewport();
		}
		const ids = await page
			.locator('[id]')
			.evaluateAll((nodes) => nodes.map((node) => node.id));
		expect(new Set(ids).size).toBe(ids.length);
	});
}

test('the visible event result follows keyboard sorts without a second live announcement', async ({
	page,
}) => {
	await page.route('https://**/*', (route) => route.abort());
	await page.goto('/demo/index.html#sort-event-listener');
	const host = page.locator('#event-demo');
	const button = host.getByRole('button', { name: 'Value', exact: true });
	await button.focus();
	await button.press('Enter');
	await expect(button).toBeFocused();
	await expect(host.locator('th').nth(1)).toHaveAttribute(
		'aria-sort',
		'ascending',
	);
	await expect(page.locator('#event-messages > div').first()).toHaveText(
		'[1] Sorted by "Value" (column 1) in ascending order',
	);
	await button.press('Space');
	await expect(button).toBeFocused();
	await expect(page.locator('#event-messages > div').first()).toHaveText(
		'[2] Sorted by "Value" (column 1) in descending order',
	);
	await expect(
		page.locator(
			'#event-log [aria-live], #event-log [role="status"], #event-log [role="log"]',
		),
	).toHaveCount(0);
	for (let count = 0; count < 6; count += 1) await button.press('Enter');
	await expect(page.locator('#event-messages > div')).toHaveCount(5);
});
