import type { Place, Route } from '#lib/types.ts';
import { distanceKm, type Timeline } from './timeline.ts';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** GPX 1.1 with the simulated track and one waypoint per scheduled stop. */
export function toGpx(route: Route, tl: Timeline, places: Map<string, Place>): string {
	const wpts = route.marks
		.filter((m) => m.kind === 'stop')
		.map((m) => places.get(m.place))
		.filter((p): p is Place => !!p)
		.map(
			(p) =>
				`  <wpt lat="${p.coordinates[1].toFixed(6)}" lon="${p.coordinates[0].toFixed(6)}">` +
				(p.elevation ? `<ele>${p.elevation}</ele>` : '') +
				`<name>${esc(p.name)}</name><type>${p.kind}</type></wpt>`
		)
		.join('\n');

	const days = new Map<number, string[]>();
	let lastKey = '';
	tl.t.forEach((_, i) => {
		const key = `${tl.lng[i].toFixed(6)},${tl.lat[i].toFixed(6)},${tl.wall[i]}`;
		if (key === lastKey) return;
		lastKey = key;
		const day = tl.day[i] ?? 1;
		const when = new Date(tl.start.getTime() + tl.wall[i] * 1000).toISOString();
		const pt = `    <trkpt lat="${tl.lat[i].toFixed(6)}" lon="${tl.lng[i].toFixed(6)}"><ele>${tl.ele[i].toFixed(1)}</ele><time>${when}</time></trkpt>`;
		(days.get(day) ?? days.set(day, []).get(day)!).push(pt);
	});
	const segs = [...days.entries()]
		.map(([day, pts]) => `  <trk><name>${esc(route.name)} route, day ${day}</name><trkseg>\n${pts.join('\n')}\n  </trkseg></trk>`)
		.join('\n');

	return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="KiliSpatial" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata><name>${esc(route.name)} route (simulated)</name><desc>Simulated walking schedule on OpenStreetMap trail geometry. Approximate, not for navigation. Data © OpenStreetMap contributors, ODbL.</desc></metadata>
${wpts}
${segs}
</gpx>
`;
}

export interface ImportedTrack {
	name: string;
	timeline: Timeline;
	/** True when the file carried timestamps; otherwise a walking pace was assumed. */
	timed: boolean;
	km: number;
	points: [number, number][];
}

/** Parse a GPX file's tracks (or route points) into a playable timeline. Throws a readable error. */
export function parseGpx(text: string, fallbackName: string): ImportedTrack {
	const doc = new DOMParser().parseFromString(text, 'application/xml');
	if (doc.querySelector('parsererror')) throw new Error('This file is not valid XML.');
	const root = doc.documentElement;
	if (root.localName !== 'gpx') throw new Error('This file is not a GPX file.');

	const all = (name: string) => [...doc.getElementsByTagNameNS('*', name)];
	let nodes = all('trkpt');
	if (!nodes.length) nodes = all('rtept');
	if (nodes.length < 2) throw new Error('No track or route points found in this GPX file.');
	if (nodes.length > 200_000) throw new Error('This GPX file is too large (over 200,000 points).');

	const read = (el: Element, tag: string) => el.getElementsByTagNameNS('*', tag)[0]?.textContent?.trim() ?? '';
	const raw = nodes
		.map((n) => ({
			lat: parseFloat(n.getAttribute('lat') ?? ''),
			lng: parseFloat(n.getAttribute('lon') ?? ''),
			ele: parseFloat(read(n, 'ele')),
			time: Date.parse(read(n, 'time'))
		}))
		.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng) && Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180);
	if (raw.length < 2) throw new Error('No valid coordinates found in this GPX file.');

	const timed = raw.every((p) => Number.isFinite(p.time)) && raw[raw.length - 1].time > raw[0].time;
	const name = read(doc.documentElement, 'name') || fallbackName;

	const tl: Timeline = {
		kind: 'imported',
		start: new Date(timed ? raw[0].time : Date.now()),
		t: [],
		wall: [],
		lng: [],
		lat: [],
		ele: [],
		km: [],
		day: [],
		dayStarts: [],
		duration: 0
	};
	let t = 0;
	let km = 0;
	raw.forEach((p, i) => {
		if (i) {
			const d = distanceKm([raw[i - 1].lng, raw[i - 1].lat], [p.lng, p.lat]);
			km += d;
			t = timed ? Math.max(t, (p.time - raw[0].time) / 1000) : t + (d / 3) * 3600;
		}
		tl.t.push(t);
		tl.wall.push(t);
		tl.lng.push(p.lng);
		tl.lat.push(p.lat);
		tl.ele.push(Number.isFinite(p.ele) ? p.ele : i ? tl.ele[i - 1] : 0);
		tl.km.push(null);
		tl.day.push(null);
	});
	tl.duration = t;
	return { name, timeline: tl, timed, km, points: raw.map((p) => [p.lng, p.lat]) };
}
