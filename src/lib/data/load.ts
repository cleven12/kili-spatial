import type { DataMeta, Place, Route, RouteSummary } from '#lib/types.ts';

const BASE = '/data';

async function getJson<T>(path: string, fetcher: typeof fetch): Promise<T> {
	const res = await fetcher(`${BASE}/${path}`);
	if (!res.ok) throw new Error(`Failed to load ${path} (${res.status})`);
	return (await res.json()) as T;
}

export interface Dataset {
	index: RouteSummary[];
	routes: Record<string, Route>;
	places: Place[];
	lodging: Place[];
	meta: DataMeta;
}

/** Load the whole dataset (~280 KB). Routes are fetched in parallel. */
export async function loadDataset(fetcher: typeof fetch = fetch): Promise<Dataset> {
	const [index, places, lodging, meta] = await Promise.all([
		getJson<RouteSummary[]>('index.json', fetcher),
		getJson<Place[]>('places.json', fetcher),
		getJson<Place[]>('lodging.json', fetcher),
		getJson<DataMeta>('meta.json', fetcher)
	]);
	const loaded = await Promise.all(index.map((r) => getJson<Route>(`routes/${r.id}.json`, fetcher)));
	return { index, places, lodging, meta, routes: Object.fromEntries(loaded.map((r) => [r.id, r])) };
}
