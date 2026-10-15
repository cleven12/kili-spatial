/**
 * Deployment settings, read from environment variables at build time
 * (see .env.example). Nothing here is secret: it ends up in the public bundle.
 */
const list = (v: string | undefined) =>
	(v ?? '')
		.split(',')
		.map((s) => s.trim().replace(/\/$/, ''))
		.filter(Boolean);

/** Where support requests are sent. Empty hides the support section. */
export const SUPPORT_EMAIL: string = (import.meta.env.VITE_SUPPORT_EMAIL ?? '').trim();

/** Origins allowed to talk to the embedded viewer via postMessage. Localhost is added in dev. */
export const EMBED_ORIGINS: string[] = [
	...list(import.meta.env.VITE_EMBED_ORIGINS),
	...(import.meta.env.DEV ? ['http://localhost:4321', 'http://localhost:5173', 'http://127.0.0.1:4321'] : [])
];

/** Author credit shown on the map itself, also when embedded. Required by the licence. */
export const AUTHOR = { name: 'Cleven G', repo: 'https://github.com/cleven12/kili-spatial' } as const;
