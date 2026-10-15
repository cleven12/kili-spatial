// Minimal Overpass client with on-disk caching, mirror fallback and retries.
// Overpass is rate-limited and flaky; results are cached in scripts/.cache so
// re-running the build is fast and works offline once populated.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const CACHE_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.cache');
const MIRRORS = [
	'https://overpass-api.de/api/interpreter',
	'https://overpass.private.coffee/api/interpreter',
	'https://overpass.kumi.systems/api/interpreter'
];
const UA = 'KiliSpatial-build/0.1 (+open-source MVP; data pipeline)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Run an Overpass QL query and return parsed JSON, cached by query hash. */
export async function overpass(label, query, { attempts = 6 } = {}) {
	await mkdir(CACHE_DIR, { recursive: true });
	const key = createHash('sha1').update(query).digest('hex').slice(0, 10);
	const file = path.join(CACHE_DIR, `${label}-${key}.json`);
	try {
		return JSON.parse(await readFile(file, 'utf8'));
	} catch {
		/* not cached */
	}

	let lastError;
	for (let i = 0; i < attempts; i++) {
		const url = MIRRORS[i % MIRRORS.length];
		try {
			const res = await fetch(url, {
				method: 'POST',
				headers: { 'User-Agent': UA, Accept: '*/*', 'Content-Type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams({ data: query }),
				signal: AbortSignal.timeout(90_000)
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const json = await res.json();
			await writeFile(file, JSON.stringify(json));
			console.log(`  fetched ${label} (${json.elements?.length ?? 0} elements) from ${new URL(url).host}`);
			return json;
		} catch (err) {
			lastError = err;
			console.log(`  ${label}: attempt ${i + 1} failed (${err.message}), retrying…`);
			await sleep(4000 * (i + 1));
		}
	}
	throw new Error(`Overpass query "${label}" failed: ${lastError?.message}`);
}
