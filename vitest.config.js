import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['test/**/*.test.js'],
		environment: 'happy-dom',
		globals: true,
		setupFiles: ['./test/setup.js'],
	},
});
