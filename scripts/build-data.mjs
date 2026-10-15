#!/usr/bin/env node
// Builds static/data/* from OpenStreetMap + curated itineraries.
//
//   pnpm build:data
//
// OSM supplies trail geometry and place positions (ODbL). Elevations are
// sampled from the same Terrarium DEM the map renders. Itineraries come from
// scripts/curated.mjs. See README "Data" for licensing and caveats.
import { mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PLACES, ROUTES, LODGING_RADIUS_KM } from './curated.mjs';
import { fetchSources, indexElements } from './lib/sources.mjs';
import { haversine, pointToSegment, simplify } from './lib/geo.mjs';
import { prefetch, elevationAt } from './lib/dem.mjs';

/** Straight connectors longer than this are reported as gaps (not real trail). */
const GAP_M = 150;
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'static', 'data');
const warnings = [];
const warn = (msg) => {
	warnings.push(msg);
	console.log(`  ⚠ ${msg}`);
};
const round = (n, d) => Math.round(n * 10 ** d) / 10 ** d;

// ---------------------------------------------------------------- sources
const src = await fetchSources();
const idx = indexElements(src.named, src.lodging, src.peaks);

// ------------------------------------------------------------- trail graph
const nodeIndex = new Map();
const coords = []; // [lon, lat]
const adj = []; // adj[i] = [[j, metres], ...]
function nodeId(p) {
	const key = `${p.lat.toFixed(6)},${p.lon.toFixed(6)}`;
	let i = nodeIndex.get(key);
	if (i === undefined) {
		i = coords.length;
		nodeIndex.set(key, i);
		coords.push([p.lon, p.lat]);
		adj.push([]);
	}
	return i;
}
for (const rel of src.routes.elements) {
	for (const m of rel.members) {
		if (m.type !== 'way' || !m.geometry) continue;
		let prev = null;
		for (const p of m.geometry) {
			const i = nodeId(p);
			if (prev !== null && prev !== i) {
				const w = haversine(coords[prev], coords[i]);
				adj[prev].push([i, w]);
				adj[i].push([prev, w]);
			}
			prev = i;
		}
	}
}
const comp = new Int32Array(coords.length).fill(-1);
let compCount = 0;
for (let i = 0; i < coords.length; i++) {
	if (comp[i] !== -1) continue;
	const stack = [i];
	comp[i] = compCount;
	while (stack.length) {
		const u = stack.pop();
		for (const [v] of adj[u]) if (comp[v] === -1) { comp[v] = compCount; stack.push(v); }
	}
	compCount++;
}
console.log(`Trail graph: ${coords.length} nodes in ${compCount} connected pieces`);

/** Closest pair of nodes between two disconnected pieces (brute force; graph is small). */
function bridge(compA, compB) {
	let best = null;
	for (let i = 0; i < coords.length; i++) {
		if (comp[i] !== compA) continue;
		for (let j = 0; j < coords.length; j++) {
			if (comp[j] !== compB) continue;
			const d = haversine(coords[i], coords[j]);
			if (!best || d < best.d) best = { a: i, b: j, d };
		}
	}
	return best;
}

function nearestNode(c) {
	let best = -1, bestD = Infinity;
	for (let i = 0; i < coords.length; i++) {
		const d = haversine(c, coords[i]);
		if (d < bestD) {
			bestD = d;
			best = i;
		}
	}
	return { node: best, dist: bestD };
}

class MinHeap {
	constructor() { this.a = []; }
	push(item) {
		const a = this.a;
		a.push(item);
		let i = a.length - 1;
		while (i > 0) {
			const p = (i - 1) >> 1;
			if (a[p][0] <= a[i][0]) break;
			[a[p], a[i]] = [a[i], a[p]];
			i = p;
		}
	}
	pop() {
		const a = this.a;
		const top = a[0];
		const last = a.pop();
		if (a.length) {
			a[0] = last;
			let i = 0;
			for (;;) {
				const l = 2 * i + 1, r = l + 1;
				let m = i;
				if (l < a.length && a[l][0] < a[m][0]) m = l;
				if (r < a.length && a[r][0] < a[m][0]) m = r;
				if (m === i) break;
				[a[m], a[i]] = [a[i], a[m]];
				i = m;
			}
		}
		return top;
	}
	get size() { return this.a.length; }
}

function shortestPath(from, to) {
	if (from === to) return [from];
	const dist = new Map([[from, 0]]);
	const prev = new Map();
	const heap = new MinHeap();
	heap.push([0, from]);
	const done = new Set();
	while (heap.size) {
		const [d, u] = heap.pop();
		if (done.has(u)) continue;
		done.add(u);
		if (u === to) break;
		for (const [v, w] of adj[u]) {
			const nd = d + w;
			if (nd < (dist.get(v) ?? Infinity)) {
				dist.set(v, nd);
				prev.set(v, u);
				heap.push([nd, v]);
			}
		}
	}
	if (!dist.has(to)) return null;
	const path = [to];
	for (let u = to; u !== from; ) {
		u = prev.get(u);
		path.push(u);
	}
	return path.reverse();
}

// ----------------------------------------------------------------- places
const eleFromTags = (t) => {
	const m = String(t?.ele ?? '').match(/\d+(\.\d+)?/);
	return m ? Number(m[0]) : null;
};
const norm = (s) => s.toLowerCase().replace(/[’']/g, '');

const places = new Map();
for (const def of PLACES) {
	let c = null, ele = null, refs = [];
	if (def.osm) {
		const found = def.osm.map((r) => idx.get(r)).filter(Boolean);
		refs = found.map((f) => f.ref);
		if (!found.length) {
			warn(`${def.id}: none of ${def.osm.join(', ')} found in OSM data`);
			continue;
		}
		c = [found[0].lon, found[0].lat];
		ele = found.map((f) => eleFromTags(f.tags)).find((e) => e !== null) ?? null;
	} else if (def.peak) {
		const hit = src.peaks.elements.find((e) => norm(e.tags.name) === norm(def.peak));
		if (!hit) {
			warn(`${def.id}: peak "${def.peak}" not in OSM`);
			continue;
		}
		c = [hit.lon, hit.lat];
		refs = [`n${hit.id}`];
		ele = eleFromTags(hit.tags);
	} else if (def.approx) {
		c = def.approx;
	}
	if (!c) continue;
	places.set(def.id, {
		def, id: def.id, name: def.name, kind: def.kind, coordinates: c,
		elevation: ele ?? def.ele ?? null,
		elevationSource: ele !== null ? 'osm' : def.ele != null ? 'curated' : 'dem',
		approximate: Boolean(def.approx),
		source: def.approx ? 'curated' : 'osm', refs
	});
}

// Snap every place to the trail graph.
for (const p of places.values()) {
	const s = nearestNode(p.coordinates);
	p.node = s.node;
	p.snapM = s.dist;
	if (p.approximate) {
		if (s.dist > 300) {
			warn(`${p.id}: nearest trail ${Math.round(s.dist)} m away; dropped`);
			places.delete(p.id);
			continue;
		}
		p.coordinates = coords[s.node]; // adopt the trail position
		p.snapM = 0;
	}
	if (s.dist > 150) warn(`${p.id}: ${Math.round(s.dist)} m from the nearest trail node (straight connector used)`);
}

// Debug helper: PAIR=a,b node scripts/build-data.mjs prints the trail path between two places.
if (process.env.PAIR) {
	const [a, b] = process.env.PAIR.split(',').map((id) => places.get(id));
	const nodes = shortestPath(a.node, b.node);
	const pts = nodes?.map((n) => coords[n]) ?? [];
	console.log(a.id, 'snap', Math.round(a.snapM), 'm ->', b.id, 'snap', Math.round(b.snapM), 'm');
	console.log('straight', (haversine(a.coordinates, b.coordinates) / 1000).toFixed(1), 'km; trail', (pts.reduce((m, p, i) => m + (i ? haversine(pts[i - 1], p) : 0), 0) / 1000).toFixed(1), 'km;', pts.length, 'nodes');
	for (let i = 0; i < pts.length; i += Math.ceil(pts.length / 14)) console.log('  ', pts[i][1].toFixed(4), pts[i][0].toFixed(4));
	process.exit(0);
}

// ----------------------------------------------------------------- routes
function buildRoute(def) {
	const verts = []; // { c: [lon, lat], stop?: string }
	const push = (c, stop) => {
		const last = verts.at(-1);
		if (last && haversine(last.c, c) < 0.5) {
			if (stop && !last.stop) last.stop = stop;
			return verts.length - 1;
		}
		verts.push({ c, stop });
		return verts.length - 1;
	};

	const dayRanges = [];
	for (const [di, day] of def.days.entries()) {
		const ids = [day.from, ...(day.via ?? []), day.to].filter((id) => {
			if (places.has(id)) return true;
			warn(`${def.id} day ${di + 1}: unknown place "${id}" skipped`);
			return false;
		});
		if (!places.has(day.from) || !places.has(day.to)) {
			warn(`${def.id} day ${di + 1}: missing endpoint, day skipped`);
			continue;
		}
		let startIdx = null;
		for (let k = 0; k < ids.length; k++) {
			const A = places.get(ids[k]);
			if (k === 0) startIdx = push(A.coordinates, A.id);
			if (k === ids.length - 1) break;
			const B = places.get(ids[k + 1]);
			let nodes = shortestPath(A.node, B.node);
			if (!nodes && comp[A.node] !== comp[B.node]) {
				// Disconnected trail pieces: follow real trail on each side, bridge the break.
				const br = bridge(comp[A.node], comp[B.node]);
				const left = shortestPath(A.node, br.a), right = shortestPath(br.b, B.node);
				if (left && right) {
					warn(`${def.id}: ${A.id} -> ${B.id} crosses a ${Math.round(br.d)} m break in the OSM trail (bridged, marked as gap)`);
					nodes = [...left, ...right];
					const joint = left.length - 1;
					for (const [i, n] of nodes.entries()) {
						push(coords[n]);
						if (i === joint) verts.at(-1).gapNext = true;
					}
					if (B.snapM > 8) push(coords[B.node]);
					push(B.coordinates, B.id);
					continue;
				}
			}
			if (!nodes) {
				warn(`${def.id}: no trail path ${A.id} -> ${B.id}; straight line used`);
				verts.at(-1).gapNext = true;
			} else {
				if (A.snapM > 8) {
					if (A.snapM > GAP_M) verts.at(-1).gapNext = true;
					push(coords[A.node]);
				}
				for (const n of nodes) push(coords[n]);
				if (B.snapM > 8) {
					if (B.snapM > GAP_M) verts.at(-1).gapNext = true;
					push(coords[B.node]);
				}
			}
			push(B.coordinates, B.id);
		}
		dayRanges.push({ day: di + 1, from: day.from, to: day.to, start: startIdx, end: verts.length - 1 });
	}
	return { def, verts, dayRanges };
}
const built = ROUTES.map(buildRoute);

// ------------------------------------------------------------- elevations
console.log('Sampling elevations…');
await prefetch([
	...built.flatMap((b) => b.verts.map((v) => v.c)),
	...[...places.values()].map((p) => p.coordinates)
]);

for (const p of places.values()) {
	if (p.elevation === null) p.elevation = Math.round(elevationAt(p.coordinates));
}

function smooth(values, win = 5) {
	const h = win >> 1;
	return values.map((_, i) => {
		let s = 0, n = 0;
		for (let j = Math.max(0, i - h); j <= Math.min(values.length - 1, i + h); j++) {
			s += values[j];
			n++;
		}
		return s / n;
	});
}

/** Ascent/descent with a hysteresis threshold so DEM noise doesn't inflate totals. */
function gainLoss(eles, from, to, threshold = 6) {
	let up = 0, down = 0, ref = eles[from];
	for (let i = from + 1; i <= to; i++) {
		const d = eles[i] - ref;
		if (d >= threshold) { up += d; ref = eles[i]; }
		else if (d <= -threshold) { down -= d; ref = eles[i]; }
	}
	return [up, down];
}

const lengthKm = (pts) => {
	let m = 0;
	for (let i = 1; i < pts.length; i++) m += haversine(pts[i - 1], pts[i]);
	return m / 1000;
};

function finishRoute({ def, verts, dayRanges }) {
	const pts = verts.map((v) => v.c);
	const raw = pts.map((p) => elevationAt(p));
	const eles = smooth(raw, 5);

	const keep = new Set(dayRanges.flatMap((d) => [d.start, d.end]));
	verts.forEach((v, i) => {
		if (v.stop) keep.add(i);
		if (v.gapNext) keep.add(i).add(i + 1);
	});
	const kept = simplify(pts, 8, keep);
	const remap = new Map(kept.map((orig, k) => [orig, k]));

	const sp = kept.map((i) => pts[i]);
	const se = kept.map((i) => eles[i]);
	const km = [0];
	for (let i = 1; i < sp.length; i++) km.push(km[i - 1] + haversine(sp[i - 1], sp[i]) / 1000);

	const days = dayRanges.map((d) => {
		const s = remap.get(d.start), e = remap.get(d.end);
		const [up, down] = gainLoss(se, s, e);
		const from = places.get(d.from), to = places.get(d.to);
		return {
			day: d.day, from: d.from, to: d.to,
			title: `${from.name} to ${to.name}`,
			startKm: round(km[s], 2), endKm: round(km[e], 2),
			distanceKm: round(km[e] - km[s], 2),
			ascentM: Math.round(up), descentM: Math.round(down),
			startElevation: Math.round(se[s]), endElevation: Math.round(se[e])
		};
	});

	// Marks: every non-lodging place within 120 m of the path, once per visit.
	const marks = [];
	const stopSet = new Set(verts.filter((v) => v.stop).map((v) => v.stop));
	for (const p of places.values()) {
		const hits = [];
		for (let i = 1; i < sp.length; i++) {
			const { dist, t } = pointToSegment(p.coordinates, sp[i - 1], sp[i]);
			if (dist < 120) hits.push({ dist, km: km[i - 1] + t * (km[i] - km[i - 1]) });
		}
		hits.sort((a, b) => a.km - b.km);
		let cluster = [];
		const flush = () => {
			if (!cluster.length) return;
			const best = cluster.reduce((a, b) => (b.dist < a.dist ? b : a));
			marks.push({ place: p.id, km: round(best.km, 2), kind: stopSet.has(p.id) ? 'stop' : 'pass' });
			cluster = [];
		};
		for (const h of hits) {
			if (cluster.length && h.km - cluster.at(-1).km > 0.8) flush();
			cluster.push(h);
		}
		flush();
	}
	marks.sort((a, b) => a.km - b.km);

	// Synthetic (non-trail) stretches, merged, as [startKm, endKm] pairs.
	const gaps = [];
	kept.forEach((orig, k) => {
		if (verts[orig].gapNext && k + 1 < kept.length) {
			const last = gaps.at(-1);
			if (last && Math.abs(last[1] - km[k]) < 0.01) last[1] = round(km[k + 1], 2);
			else gaps.push([round(km[k], 2), round(km[k + 1], 2)]);
		}
	});

	const [asc, desc] = gainLoss(se, 0, se.length - 1);
	const lons = sp.map((p) => p[0]), lats = sp.map((p) => p[1]);
	return {
		id: def.id, name: def.name, nickname: def.nickname, summary: def.summary,
		accommodation: def.accommodation, unverified: def.unverified ?? false, note: def.note ?? null,
		durationDays: days.length,
		stats: {
			distanceKm: round(km.at(-1), 1), ascentM: Math.round(asc), descentM: Math.round(desc),
			minElevation: Math.round(Math.min(...se)), maxElevation: Math.round(Math.max(...se))
		},
		bbox: [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)].map((n) => round(n, 5)),
		days, marks, gaps,
		coordinates: sp.map((p, i) => [round(p[0], 5), round(p[1], 5), Math.round(se[i])])
	};
}
const routes = built.map(finishRoute);

// --------------------------------------------------------------- lodging
const gates = [...places.values()].filter((p) => p.kind === 'gate');
const lodging = [];
for (const e of src.lodging.elements) {
	const name = e.tags?.name?.trim();
	const lat = e.lat ?? e.center?.lat, lon = e.lon ?? e.center?.lon;
	if (!name || lat == null || lon == null) continue;
	let nearest = null, nd = Infinity;
	for (const g of gates) {
		const d = haversine([lon, lat], g.coordinates) / 1000;
		if (d < nd) { nd = d; nearest = g; }
	}
	if (nd > LODGING_RADIUS_KM) continue;
	lodging.push({
		id: `osm-${e.type[0]}${e.id}`, name, kind: 'lodging', subtype: e.tags.tourism,
		coordinates: [round(lon, 5), round(lat, 5)], elevation: null, source: 'osm',
		website: e.tags.website ?? e.tags['contact:website'] ?? null,
		nearestGate: nearest.id, distanceToGateKm: round(nd, 1)
	});
}
lodging.sort((a, b) => a.distanceToGateKm - b.distanceToGateKm);

// ----------------------------------------------------------------- output
const usedBy = new Map();
for (const r of routes) for (const m of r.marks) (usedBy.get(m.place) ?? usedBy.set(m.place, new Set()).get(m.place)).add(r.id);

const outPlaces = [...places.values()].map((p) => ({
	id: p.id, name: p.name, kind: p.kind,
	coordinates: [round(p.coordinates[0], 5), round(p.coordinates[1], 5)],
	elevation: Math.round(p.elevation), elevationSource: p.elevationSource,
	source: p.source, approximate: p.approximate,
	alt: p.def.alt ?? [], note: p.def.note ?? null,
	routes: [...(usedBy.get(p.id) ?? [])].sort(), osm: p.refs
}));

await rm(OUT, { recursive: true, force: true });
await mkdir(path.join(OUT, 'routes'), { recursive: true });
const write = (f, o) => writeFile(path.join(OUT, f), JSON.stringify(o));

await Promise.all([
	write('places.json', outPlaces),
	write('lodging.json', lodging),
	...routes.map((r) => write(`routes/${r.id}.json`, r)),
	write('index.json', routes.map((r) => ({
		id: r.id, name: r.name, nickname: r.nickname, summary: r.summary, accommodation: r.accommodation,
		unverified: r.unverified, durationDays: r.durationDays, bbox: r.bbox,
		...r.stats,
		start: r.days[0].from, end: r.days.at(-1).to
	}))),
	write('meta.json', {
		generated: new Date().toISOString().slice(0, 10),
		attribution: [
			'Route geometry and places © OpenStreetMap contributors, ODbL 1.0 (https://www.openstreetmap.org/copyright)',
			'Elevation sampled from Mapzen/AWS Terrain Tiles (Terrarium)'
		],
		caveats: [
			'Itineraries are typical operator schedules, not official park routes.',
			'Distances and ascent are computed from OSM geometry and a ~19 m DEM; expect a few percent error.',
			'Not for navigation.'
		]
	})
]);

// ---------------------------------------------------------------- summary
console.log('\nRoute              days   km   ascent  max ele');
for (const r of routes) {
	console.log(
		`${r.name.padEnd(18)} ${String(r.durationDays).padStart(3)} ${String(r.stats.distanceKm).padStart(6)} ${String(r.stats.ascentM).padStart(7)} ${String(r.stats.maxElevation).padStart(8)}`
	);
}
console.log(`\n${outPlaces.length} places, ${lodging.length} lodging, ${warnings.length} warnings`);
