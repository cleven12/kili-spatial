/** Shapes of the JSON files produced by `pnpm build:data` (static/data). */

export type PlaceKind = 'gate' | 'camp' | 'hut' | 'summit' | 'lodging';

export interface Place {
	id: string;
	name: string;
	kind: PlaceKind;
	/** [longitude, latitude] */
	coordinates: [number, number];
	/** Metres above sea level; null for lodging (not sampled). */
	elevation: number | null;
	elevationSource?: 'osm' | 'curated' | 'dem';
	source: 'osm' | 'curated';
	/** True when the position is approximate (curated, snapped to the trail). */
	approximate?: boolean;
	alt?: string[];
	note?: string | null;
	/** Route ids that pass this place. */
	routes?: string[];
	osm?: string[];
	/** Lodging only. */
	subtype?: string;
	website?: string | null;
	nearestGate?: string;
	distanceToGateKm?: number;
}

export type Accommodation = 'huts' | 'camping';

export interface RouteSummary {
	id: string;
	name: string;
	nickname: string;
	summary: string;
	accommodation: Accommodation;
	unverified: boolean;
	durationDays: number;
	bbox: [number, number, number, number];
	distanceKm: number;
	ascentM: number;
	descentM: number;
	minElevation: number;
	maxElevation: number;
	start: string;
	end: string;
}

export interface RouteDay {
	day: number;
	from: string;
	to: string;
	title: string;
	startKm: number;
	endKm: number;
	distanceKm: number;
	ascentM: number;
	descentM: number;
	startElevation: number;
	endElevation: number;
}

export interface RouteMark {
	place: string;
	km: number;
	/** `stop` = scheduled stop or via point; `pass` = place the trail runs within 120 m of. */
	kind: 'stop' | 'pass';
}

export interface Route extends Omit<RouteSummary, 'distanceKm' | 'ascentM' | 'descentM' | 'minElevation' | 'maxElevation' | 'start' | 'end'> {
	note: string | null;
	stats: {
		distanceKm: number;
		ascentM: number;
		descentM: number;
		minElevation: number;
		maxElevation: number;
	};
	days: RouteDay[];
	marks: RouteMark[];
	/** Straight, non-trail stretches as [startKm, endKm]. */
	gaps: [number, number][];
	/** [longitude, latitude, elevationMetres] */
	coordinates: [number, number, number][];
}

export interface DataMeta {
	generated: string;
	attribution: string[];
	caveats: string[];
}
