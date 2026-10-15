// Elevation sampling from AWS Terrarium tiles (same data the map renders).
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { PNG } from 'pngjs';

const Z = 13;
const CACHE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.cache', 'dem');
const tiles = new Map();

const worldPx = ([lon, lat]) => {
	const n = 2 ** Z * 256;
	const x = ((lon + 180) / 360) * n;
	const s = Math.sin((lat * Math.PI) / 180);
	const y = (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * n;
	return [x, y];
};

async function loadTile(tx, ty) {
	const key = `${tx}/${ty}`;
	if (tiles.has(key)) return tiles.get(key);
	await mkdir(CACHE, { recursive: true });
	const file = path.join(CACHE, `${Z}-${tx}-${ty}.png`);
	let buf;
	try {
		buf = await readFile(file);
	} catch {
		const url = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${Z}/${tx}/${ty}.png`;
		for (let i = 0; i < 4; i++) {
			try {
				const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				buf = Buffer.from(await res.arrayBuffer());
				await writeFile(file, buf);
				break;
			} catch (err) {
				if (i === 3) throw err;
				await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
			}
		}
	}
	const png = PNG.sync.read(buf);
	tiles.set(key, png);
	return png;
}

/** Download every tile needed to sample the given [lon, lat] points. */
export async function prefetch(points) {
	const need = new Set();
	for (const p of points) {
		const [x, y] = worldPx(p);
		for (const dx of [-1, 0, 1]) for (const dy of [-1, 0, 1]) {
			need.add(`${Math.floor((x + dx) / 256)}/${Math.floor((y + dy) / 256)}`);
		}
	}
	const list = [...need].map((k) => k.split('/').map(Number));
	console.log(`  loading ${list.length} elevation tiles…`);
	let i = 0;
	await Promise.all(
		Array.from({ length: 6 }, async () => {
			while (i < list.length) {
				const [tx, ty] = list[i++];
				await loadTile(tx, ty);
			}
		})
	);
}

function pixel(px, py) {
	const tx = Math.floor(px / 256), ty = Math.floor(py / 256);
	const png = tiles.get(`${tx}/${ty}`);
	if (!png) return NaN;
	const i = ((py - ty * 256) * 256 + (px - tx * 256)) * 4;
	return png.data[i] * 256 + png.data[i + 1] + png.data[i + 2] / 256 - 32768;
}

/** Bilinear elevation in metres. Tiles must have been prefetched. */
export function elevationAt(point) {
	const [x, y] = worldPx(point);
	const x0 = Math.floor(x - 0.5), y0 = Math.floor(y - 0.5);
	const fx = x - 0.5 - x0, fy = y - 0.5 - y0;
	const a = pixel(x0, y0), b = pixel(x0 + 1, y0), c = pixel(x0, y0 + 1), d = pixel(x0 + 1, y0 + 1);
	return a * (1 - fx) * (1 - fy) + b * fx * (1 - fy) + c * (1 - fx) * fy + d * fx * fy;
}
