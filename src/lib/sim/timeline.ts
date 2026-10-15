import type { Route } from '#lib/types.ts';
import { Track } from '#lib/data/track.ts';

const R = 6371008.8;
const rad = (d: number) => (d * Math.PI) / 180;

export function distanceKm(a: readonly number[], b: readonly number[]): number {
	const dLat = rad(b[1] - a[1]);
	const dLon = rad(b[0] - a[0]);
	const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLon / 2) ** 2;
	return (2 * R * Math.asin(Math.sqrt(h))) / 1000;
}

export function headingDeg(a: readonly number[], b: readonly number[]): number {
	const y = Math.sin(rad(b[0] - a[0])) * Math.cos(rad(b[1]));
	const x =
		Math.cos(rad(a[1])) * Math.sin(rad(b[1])) -
		Math.sin(rad(a[1])) * Math.cos(rad(b[1])) * Math.cos(rad(b[0] - a[0]));
	return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** One location sample, shaped like a device GPS fix. */
export interface Fix {
	lng: number;
	lat: number;
	ele: number;
	/** Seconds since the timeline start. */
	t: number;
	/** Wall-clock time of the fix. */
	time: Date;
	speedKmh: number;
	/** Degrees clockwise from north. */
	heading: number;
	/** Horizontal accuracy radius in metres (synthetic for simulations). */
	accuracy: number;
	/** Distance along the selected route; null for imported/live fixes. */
	km: number | null;
	/** Itinerary day (1-based); null when unknown. */
	day: number | null;
	moving: boolean;
}

/** A timed path: knots of (time, position). Held positions repeat a knot. */
export interface Timeline {
	kind: 'simulated' | 'imported';
	/** Wall-clock time at t = 0. */
	start: Date;
	/** Active seconds: nights are skipped, so playback does not idle through them. */
	t: number[];
	/** Wall-clock seconds since `start`, parallel to `t`. */
	wall: number[];
	lng: number[];
	lat: number[];
	ele: number[];
	km: (number | null)[];
	day: (number | null)[];
	/** t of the first knot of each day (for timeline ticks). */
	dayStarts: { day: number; t: number }[];
	duration: number;
}

const STEP_KM = 0.025;
const DAY_START_HOUR = 7.5;
const LUNCH_S = 30 * 60;
/** Tanzania has no daylight saving: UTC+3 all year. */
const EAT_OFFSET = '+03:00';

/**
 * Walking speed in km/h from slope and altitude. Tobler's hiking function,
 * scaled down for a guided group ("pole pole") and thin air.
 */
export function paceKmh(slope: number, ele: number): number {
	const tobler = 6 * Math.exp(-3.5 * Math.abs(slope + 0.05));
	const altitude = Math.max(0.55, 1 - 0.00007 * Math.max(0, ele - 2000));
	return Math.max(0.8, tobler * 0.55 * altitude);
}

export function trekStart(date: string): Date {
	return new Date(`${date}T00:00:00${EAT_OFFSET}`);
}

/** Simulate a typical trek day by day (t = 0 is 07:30 on day 1): 07:30 starts, a 30 minute lunch, overnight at each camp. */
export function simulateRoute(route: Route, startDate: string): Timeline {
	const track = new Track(route);
	const tl: Timeline = {
		kind: 'simulated',
		start: new Date(trekStart(startDate).getTime() + DAY_START_HOUR * 3600_000),
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
	let skipped = 0;
	const push = (t: number, km: number, day: number) => {
		const p = track.pointAt(km);
		tl.t.push(t - skipped);
		tl.wall.push(t);
		tl.lng.push(p.lng);
		tl.lat.push(p.lat);
		tl.ele.push(p.ele);
		tl.km.push(km);
		tl.day.push(day);
	};

	for (const d of route.days) {
		let t = (d.day - 1) * 86400;
		if (tl.wall.length) skipped += t - tl.wall[tl.wall.length - 1];
		tl.dayStarts.push({ day: d.day, t: t - skipped });
		const half = (d.startKm + d.endKm) / 2;
		let lunched = false;
		let km = d.startKm;
		push(t, km, d.day);
		while (km < d.endKm - 1e-9) {
			const next = Math.min(d.endKm, km + STEP_KM);
			const a = track.pointAt(km);
			const b = track.pointAt(next);
			const run = (next - km) * 1000;
			const speed = paceKmh(run > 0 ? (b.ele - a.ele) / run : 0, (a.ele + b.ele) / 2);
			t += ((next - km) / speed) * 3600;
			km = next;
			push(t, km, d.day);
			if (!lunched && km >= half && d.endKm - km > 0.5) {
				lunched = true;
				t += LUNCH_S;
				push(t, km, d.day);
			}
		}
	}
	tl.duration = tl.t[tl.t.length - 1];
	return tl;
}

function lerp(a: number, b: number, f: number) {
	return a + (b - a) * f;
}

/** Deterministic pseudo-random in [0, 1) so the same moment always gives the same noise. */
function noise(t: number): number {
	const s = Math.sin(t * 12.9898 + 78.233) * 43758.5453;
	return s - Math.floor(s);
}

/** Typical consumer GPS accuracy: worse under rainforest canopy, best on open ridges. */
function accuracyAt(ele: number, t: number): number {
	const base = ele < 2800 ? 12 : ele < 4000 ? 6 : 4;
	return Math.round((base * (0.8 + 0.6 * noise(Math.floor(t / 5)))) * 10) / 10;
}

/** Interpolated fix at timeline time `t` seconds. */
export function fixAt(tl: Timeline, t: number): Fix {
	const T = tl.t;
	const c = Math.min(tl.duration, Math.max(0, t));
	let lo = 0;
	let hi = T.length - 1;
	while (hi - lo > 1) {
		const mid = (lo + hi) >> 1;
		if (T[mid] <= c) lo = mid;
		else hi = mid;
	}
	const span = T[hi] - T[lo];
	const f = span > 0 ? (c - T[lo]) / span : 0;
	const a = [tl.lng[lo], tl.lat[lo]];
	const b = [tl.lng[hi], tl.lat[hi]];
	const metres = distanceKm(a, b) * 1000;
	// Moving only when the segment is short enough to be a real step, not an overnight jump.
	const moving = metres > 0.5 && span < 600;
	const km = tl.km[lo] !== null && tl.km[hi] !== null ? lerp(tl.km[lo]!, tl.km[hi]!, f) : null;
	return {
		lng: lerp(a[0], b[0], f),
		lat: lerp(a[1], b[1], f),
		ele: lerp(tl.ele[lo], tl.ele[hi], f),
		t: c,
		time: new Date(tl.start.getTime() + lerp(tl.wall[lo], tl.wall[hi], f) * 1000),
		speedKmh: moving ? (metres / 1000 / span) * 3600 : 0,
		heading: headingFor(tl, lo, hi),
		accuracy: accuracyAt(lerp(tl.ele[lo], tl.ele[hi], f), c),
		km,
		day: tl.day[lo],
		moving
	};
}

/** Heading of the nearest step with real movement, so a held fix keeps its last bearing. */
function headingFor(tl: Timeline, lo: number, hi: number): number {
	for (let i = hi; i < Math.min(tl.t.length, hi + 40); i++) {
		const a = [tl.lng[i - 1], tl.lat[i - 1]];
		const b = [tl.lng[i], tl.lat[i]];
		if (distanceKm(a, b) > 0.002) return headingDeg(a, b);
	}
	for (let i = lo; i > 0 && i > lo - 40; i--) {
		const a = [tl.lng[i - 1], tl.lat[i - 1]];
		const b = [tl.lng[i], tl.lat[i]];
		if (distanceKm(a, b) > 0.002) return headingDeg(a, b);
	}
	return 0;
}

export function formatClock(d: Date): string {
	return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Dar_es_Salaam' }).format(d);
}
