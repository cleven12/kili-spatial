import { loadDataset, type Dataset } from '#lib/data/load.ts';
import { oxygenAtElevation, weatherAt } from '#lib/data/environment.ts';
import { Track } from '#lib/data/track.ts';
import type { DataMeta, Place, Route, RouteSummary } from '#lib/types.ts';

export type CameraCommand =
	| { kind: 'place'; id: string }
	| { kind: 'day'; day: number }
	| { kind: 'route' }
	| { kind: 'overview' };

const DEFAULT_ROUTE = 'marangu';

class TrekState {
	status = $state<'idle' | 'loading' | 'ready' | 'error'>('idle');
	error = $state<string | null>(null);

	index = $state.raw<RouteSummary[]>([]);
	routes = $state.raw<Record<string, Route>>({});
	places = $state.raw<Place[]>([]);
	lodging = $state.raw<Place[]>([]);
	meta = $state.raw<DataMeta | null>(null);

	/** Selected route id; null shows every route (mountain overview). */
	routeId = $state<string | null>(null);
	/** Km along the selected route shown by the readout/chart/marker; null = not scrubbing. */
	scrubKm = $state<number | null>(null);
	scrubbing = $state(false);
	playing = $state(false);
	activeDay = $state<number | null>(null);
	/** Place whose detail card is open. */
	activePlace = $state<string | null>(null);
	/** Latest camera request; each assignment is a fresh object so effects re-run. */
	command = $state<CameraCommand | null>(null);
	mapReady = $state(false);
	/** Elevation under the map centre when nothing is scrubbed. */
	viewElevation = $state<number | null>(null);
	showLodging = $state(false);

	route = $derived(this.routeId ? (this.routes[this.routeId] ?? null) : null);
	track = $derived(this.route ? new Track(this.route) : null);
	totalKm = $derived(this.track?.total ?? 0);
	progress = $derived(this.scrubKm === null || !this.totalKm ? 0 : this.scrubKm / this.totalKm);
	placeById = $derived(new Map([...this.places, ...this.lodging].map((p) => [p.id, p])));

	elevation = $derived(
		this.scrubKm !== null && this.track
			? Math.round(this.track.elevationAt(this.scrubKm))
			: this.viewElevation !== null
				? Math.round(this.viewElevation)
				: 1860
	);
	oxygen = $derived(oxygenAtElevation(this.elevation));
	weather = $derived(weatherAt(this.elevation));

	async init(fetcher: typeof fetch = fetch) {
		if (this.status !== 'idle') return;
		this.status = 'loading';
		try {
			const data: Dataset = await loadDataset(fetcher);
			this.index = data.index;
			this.routes = data.routes;
			this.places = data.places;
			this.lodging = data.lodging;
			this.meta = data.meta;
			const wanted = new URLSearchParams(location.search).get('route');
			this.routeId = wanted === 'all' ? null : wanted && data.routes[wanted] ? wanted : DEFAULT_ROUTE;
			this.command = this.routeId ? { kind: 'route' } : { kind: 'overview' };
			this.status = 'ready';
		} catch (err) {
			this.error = err instanceof Error ? err.message : String(err);
			this.status = 'error';
		}
	}

	private resetSelection() {
		this.scrubKm = null;
		this.activeDay = null;
		this.activePlace = null;
		this.playing = false;
	}

	selectRoute(id: string | null) {
		this.routeId = id;
		this.resetSelection();
		this.command = id ? { kind: 'route' } : { kind: 'overview' };
		const url = new URL(location.href);
		url.searchParams.set('route', id ?? 'all');
		history.replaceState(history.state, '', url);
	}

	setScrub(km: number | null) {
		this.scrubKm = km === null || !this.track ? null : this.track.clamp(km);
	}

	focusPlace(id: string) {
		this.scrubKm = null;
		this.activePlace = id;
		this.activeDay = null;
		this.playing = false;
		this.command = { kind: 'place', id };
	}

	focusDay(day: number) {
		this.scrubKm = null;
		this.activeDay = day;
		this.activePlace = null;
		this.playing = false;
		this.command = { kind: 'day', day };
	}

	showRoute() {
		this.resetSelection();
		this.command = this.routeId ? { kind: 'route' } : { kind: 'overview' };
	}

	togglePlay() {
		if (!this.track) return;
		if (this.playing) {
			this.playing = false;
			return;
		}
		this.activeDay = null;
		this.activePlace = null;
		this.playing = true;
	}
}

export const trek = new TrekState();
