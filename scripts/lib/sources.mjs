// All Overpass queries used by the build, kept in one place.
import { overpass } from './overpass.mjs';
import { OSM_ROUTE_RELATIONS, PLACES } from '../curated.mjs';

const BBOX = '-3.45,37.0,-2.85,37.7'; // south,west,north,east around Kilimanjaro
const PEAK_BBOX = '-3.2,37.2,-2.95,37.55';
const q = (body) => `[out:json][timeout:60];(${body});out tags center;`;

export async function fetchSources() {
	console.log('Fetching OpenStreetMap data…');
	const routes = await overpass(
		'routes',
		`[out:json][timeout:90];relation(id:${OSM_ROUTE_RELATIONS.join(',')});out geom;`
	);
	// Fetch exactly the curated OSM objects by id: small, fast and deterministic.
	const refs = PLACES.flatMap((p) => p.osm ?? []);
	const ids = (t) => refs.filter((r) => r[0] === t).map((r) => r.slice(1)).join(',');
	const named = await overpass(
		'places',
		q(`node(id:${ids('n')});way(id:${ids('w')});`)
	);
	const lodging = await overpass(
		'lodging',
		q(`nwr["tourism"~"^(hotel|guest_house|hostel|chalet|apartment|motel)$"](${BBOX});`)
	);
	const peaks = await overpass('peaks', q(`node["natural"="peak"]["name"](${PEAK_BBOX});`));
	return { routes, named, lodging, peaks };
}

/** Index tag elements by "n123"/"w123"/"r123". */
export function indexElements(...sets) {
	const map = new Map();
	for (const set of sets) {
		for (const e of set.elements) {
			const lat = e.lat ?? e.center?.lat;
			const lon = e.lon ?? e.center?.lon;
			if (lat == null || lon == null) continue;
			map.set(`${e.type[0]}${e.id}`, { ref: `${e.type[0]}${e.id}`, lat, lon, tags: e.tags ?? {} });
		}
	}
	return map;
}
