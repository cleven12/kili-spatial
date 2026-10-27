import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	// maplibre-gl v6 loads a sibling worker module that dep pre-bundling does not copy.
	optimizeDeps: { exclude: ['maplibre-gl'] },
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter({ fallback: 'index.html' }),
			// The guide pages under /routes and /<lang>/ are static files from scripts/seo.mjs, not app routes.
			prerender: {
				handleHttpError: ({ path, message }) => {
					if (/^\/((sw|it|fr|de)\/)?routes\//.test(path)) return;
					throw new Error(message);
				}
			}
		})
	]
});
