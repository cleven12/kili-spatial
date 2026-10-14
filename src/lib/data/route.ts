import {
	MARANGU_ELEVATION_PROFILE,
	MARANGU_GEOJSON,
	MARANGU_WAYPOINTS,
	type Waypoint
} from './maranguRoute.ts';

export interface TrackPoint {
	lng: number;
	lat: number;
	/** Distance along the ascent in km, aligned to MARANGU_ELEVATION_PROFILE. */
	km: number;
}

export interface Stage {
	id: number;
	day: number;
	title: string;
	from: Waypoint;
	to: Waypoint;
	startKm: number;
	endKm: number;
	distanceKm: number;
	gainM: number;
}

export interface TrackPosition {
	lng: number;
	lat: number;
	bearing: number;
	km: number;
}

const lineFeature = MARANGU_GEOJSON.features.find((f) => f.geometry.type === 'LineString');
if (!lineFeature || lineFeature.geometry.type !== 'LineString') {
	throw new Error('Marangu GeoJSON is missing its LineString feature');
}

export const ROUTE_COORDINATES = lineFeature.geometry.coordinates as [number, number][];

const toRad = (d: number) => (d * Math.PI) / 180;

function haversineKm(a: [number, number], b: [number, number]): number {
	const dLat = toRad(b[1] - a[1]);
	const dLng = toRad(b[0] - a[0]);
	const h =
		Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLng / 2) ** 2;
	return 2 * 6371 * Math.asin(Math.sqrt(h));
}

function bearingDeg(a: [number, number], b: [number, number]): number {
	const y = Math.sin(toRad(b[0] - a[0])) * Math.cos(toRad(b[1]));
	const x =
		Math.cos(toRad(a[1])) * Math.sin(toRad(b[1])) -
		Math.sin(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.cos(toRad(b[0] - a[0]));
	return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** Profile distance (km) for a waypoint, matched by name. */
function profileKm(wp: Waypoint): number {
	const hit = MARANGU_ELEVATION_PROFILE.find((p) => p.name === wp.name);
	if (!hit) throw new Error(`No elevation profile entry for ${wp.name}`);
	return hit.distanceKm;
}

/** Index of each waypoint within the route polyline. */
export const WAYPOINT_VERTEX_INDEX: number[] = MARANGU_WAYPOINTS.map((wp) => {
	const i = ROUTE_COORDINATES.findIndex(
		([lng, lat]) => lng === wp.coordinates[0] && lat === wp.coordinates[1]
	);
	if (i < 0) throw new Error(`Waypoint ${wp.name} not on route polyline`);
	return i;
});

/**
 * Polyline vertices annotated with km. Raw haversine length differs from the
 * published profile, so each waypoint-to-waypoint leg is rescaled to the
 * profile distances; this keeps chart, HUD and map scrubbing consistent.
 */
export const TRACK: TrackPoint[] = (() => {
	const pts: TrackPoint[] = [];
	for (let w = 0; w < MARANGU_WAYPOINTS.length - 1; w++) {
		const i0 = WAYPOINT_VERTEX_INDEX[w];
		const i1 = WAYPOINT_VERTEX_INDEX[w + 1];
		const k0 = profileKm(MARANGU_WAYPOINTS[w]);
		const k1 = profileKm(MARANGU_WAYPOINTS[w + 1]);
		const raw: number[] = [0];
		for (let i = i0 + 1; i <= i1; i++) {
			raw.push(raw[raw.length - 1] + haversineKm(ROUTE_COORDINATES[i - 1], ROUTE_COORDINATES[i]));
		}
		const total = raw[raw.length - 1];
		for (let i = i0; i <= i1; i++) {
			if (w > 0 && i === i0) continue; // shared vertex already pushed
			const [lng, lat] = ROUTE_COORDINATES[i];
			pts.push({ lng, lat, km: k0 + ((k1 - k0) * raw[i - i0]) / total });
		}
	}
	return pts;
})();

export const TOTAL_KM = TRACK[TRACK.length - 1].km;

export const ELEVATION_MIN = MARANGU_ELEVATION_PROFILE[0].elevation;
export const ELEVATION_MAX = MARANGU_ELEVATION_PROFILE[MARANGU_ELEVATION_PROFILE.length - 1].elevation;

export const clampKm = (km: number) => Math.min(TOTAL_KM, Math.max(0, km));

export function pointAtDistance(km: number): TrackPosition {
	const d = clampKm(km);
	let i = TRACK.findIndex((p) => p.km >= d);
	if (i <= 0) i = 1;
	const a = TRACK[i - 1];
	const b = TRACK[i];
	const t = b.km === a.km ? 0 : (d - a.km) / (b.km - a.km);
	return {
		lng: a.lng + (b.lng - a.lng) * t,
		lat: a.lat + (b.lat - a.lat) * t,
		bearing: bearingDeg([a.lng, a.lat], [b.lng, b.lat]),
		km: d
	};
}

export function elevationAtDistance(km: number): number {
	const d = clampKm(km);
	const prof = MARANGU_ELEVATION_PROFILE;
	let i = prof.findIndex((p) => p.distanceKm >= d);
	if (i <= 0) i = 1;
	const a = prof[i - 1];
	const b = prof[i];
	const t = (d - a.distanceKm) / (b.distanceKm - a.distanceKm);
	return a.elevation + (b.elevation - a.elevation) * t;
}

/** Closest point on the track to a lng/lat, as km along the route. */
export function nearestKm(lng: number, lat: number): number {
	let best = 0;
	let bestD = Infinity;
	for (const p of TRACK) {
		const d = (p.lng - lng) ** 2 + (p.lat - lat) ** 2;
		if (d < bestD) {
			bestD = d;
			best = p.km;
		}
	}
	return best;
}

/** Route polyline up to `km`, for progress rendering. */
export function coordinatesUpTo(km: number): [number, number][] {
	const d = clampKm(km);
	const out: [number, number][] = [];
	for (const p of TRACK) {
		if (p.km >= d) break;
		out.push([p.lng, p.lat]);
	}
	const end = pointAtDistance(d);
	out.push([end.lng, end.lat]);
	return out;
}

/** Coordinates between two km marks (inclusive), for stage highlighting. */
export function coordinatesBetween(startKm: number, endKm: number): [number, number][] {
	const s = pointAtDistance(startKm);
	const e = pointAtDistance(endKm);
	const mid = TRACK.filter((p) => p.km > startKm && p.km < endKm).map(
		(p) => [p.lng, p.lat] as [number, number]
	);
	return [[s.lng, s.lat], ...mid, [e.lng, e.lat]];
}

/** Stage k is the leg between waypoint k-1 and k, with a final descent day. */
export const STAGES: Stage[] = MARANGU_WAYPOINTS.slice(1).map((to, i) => {
	const from = MARANGU_WAYPOINTS[i];
	const startKm = profileKm(from);
	const endKm = profileKm(to);
	return {
		id: i + 1,
		day: i + 1,
		title: `${from.name} → ${to.name}`,
		from,
		to,
		startKm,
		endKm,
		distanceKm: endKm - startKm,
		gainM: to.elevation - from.elevation
	};
});

/**
 * Fraction of sea-level oxygen available, from the standard barometric
 * formula. Matches the published per-waypoint figures (e.g. ~48% at 5,895 m).
 */
export function oxygenAtElevation(m: number): number {
	return Math.round(100 * Math.pow(1 - 2.25577e-5 * m, 5.25588));
}

export function vegetationAt(m: number): string {
	if (m < 2800) return 'Montane Rainforest';
	if (m < 4000) return 'Heath & Moorland';
	if (m < 5000) return 'Alpine Desert';
	return 'Arctic Summit';
}

export interface Weather {
	label: string;
	tempC: number;
	windKph: number;
	icon: 'cloud-rain' | 'cloud' | 'sun' | 'wind' | 'snowflake';
}

/** Deterministic, elevation-based weather simulation. */
export function weatherAt(m: number): Weather {
	const tempC = Math.round(24 - 6.5 * ((m - 1000) / 1000));
	if (m < 2800) return { label: 'Humid mist', tempC, windKph: 6, icon: 'cloud-rain' };
	if (m < 4000) return { label: 'Clear, breezy', tempC, windKph: 18, icon: 'sun' };
	if (m < 5000) return { label: 'Dry, cold', tempC, windKph: 26, icon: 'wind' };
	return { label: 'Freezing, high wind', tempC, windKph: 42, icon: 'snowflake' };
}
