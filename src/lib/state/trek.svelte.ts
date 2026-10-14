import { TOTAL_KM, clampKm, elevationAtDistance, oxygenAtElevation, weatherAt } from '#lib/data/route.ts';

export type CameraCommand =
	| { kind: 'waypoint'; id: string }
	| { kind: 'stage'; id: number }
	| { kind: 'overview' };

class TrekState {
	/** Km along the ascent shown by the HUD/chart/marker; null = nothing scrubbed. */
	scrubKm = $state<number | null>(null);
	/** True while the chart is being pointed at (suppresses camera follow). */
	scrubbing = $state(false);
	playing = $state(false);
	/** Stage currently highlighted, or null for the whole route. */
	activeStage = $state<number | null>(null);
	activeWaypoint = $state<string | null>(null);
	/** Latest camera request; each assignment is a fresh object so effects re-run. */
	command = $state<CameraCommand | null>(null);
	/** Set by the map once the style/terrain has loaded. */
	mapReady = $state(false);
	/** Camera altitude readout when nothing is scrubbed (map center elevation). */
	viewElevation = $state<number | null>(null);

	progress = $derived(this.scrubKm === null ? 0 : this.scrubKm / TOTAL_KM);

	elevation = $derived(
		this.scrubKm !== null
			? Math.round(elevationAtDistance(this.scrubKm))
			: this.viewElevation !== null
				? Math.round(this.viewElevation)
				: 1860
	);
	oxygen = $derived(oxygenAtElevation(this.elevation));
	weather = $derived(weatherAt(this.elevation));

	setScrub(km: number | null) {
		this.scrubKm = km === null ? null : clampKm(km);
	}

	focusWaypoint(id: string) {
		this.activeWaypoint = id;
		this.activeStage = null;
		this.playing = false;
		this.command = { kind: 'waypoint', id };
	}

	focusStage(id: number) {
		this.activeStage = id;
		this.activeWaypoint = null;
		this.playing = false;
		this.command = { kind: 'stage', id };
	}

	showOverview() {
		this.activeStage = null;
		this.activeWaypoint = null;
		this.playing = false;
		this.command = { kind: 'overview' };
	}

	togglePlay() {
		if (this.playing) {
			this.playing = false;
			return;
		}
		this.activeStage = null;
		this.activeWaypoint = null;
		this.playing = true;
	}
}

export const trek = new TrekState();
