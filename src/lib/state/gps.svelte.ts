import { toGpx, parseGpx, type ImportedTrack } from '#lib/sim/gpx.ts';
import { fixAt, simulateRoute, type Fix, type Timeline } from '#lib/sim/timeline.ts';
import type { Key } from '#lib/i18n/en.ts';
import { trek } from '#lib/state/trek.svelte.ts';

export const RATES = [
	{ value: 60, label: '1 min / s' },
	{ value: 600, label: '10 min / s' },
	{ value: 1800, label: '30 min / s' },
	{ value: 3600, label: '60 min / s' }
] as const;

const today = () => new Date().toLocaleDateString('en-CA');

/**
 * GPS simulation and location tracking. A `Fix` comes from one of three sources:
 * a simulated schedule on the selected route, an imported GPX file, or the
 * device's own location (opt-in, never stored or sent anywhere).
 */
class GpsState {
	mode = $state<'off' | 'sim' | 'import' | 'live'>('off');
	timeline = $state.raw<Timeline | null>(null);
	imported = $state.raw<ImportedTrack | null>(null);
	/** Seconds into the timeline. */
	clock = $state(0);
	playing = $state(false);
	rate = $state<number>(600);
	/** Camera follows the position while true. */
	follow = $state(true);
	startDate = $state(today());
	live = $state.raw<Fix | null>(null);
	/** i18n key of the last error. */
	error = $state<Key | null>(null);

	private frame = 0;
	private watchId: number | null = null;

	fix = $derived<Fix | null>(
		this.mode === 'live' ? this.live : this.timeline ? fixAt(this.timeline, this.clock) : null
	);
	atEnd = $derived(!!this.timeline && this.clock >= this.timeline.duration - 0.5);
	/** Imported track polyline for display. */
	trace = $derived(this.mode === 'import' ? (this.imported?.points ?? null) : null);

	private reset() {
		this.pause();
		this.stopLive();
		this.clock = 0;
		this.error = null;
	}

	/** Build (or rebuild) the simulated schedule for the selected route. */
	startSim() {
		this.reset();
		const route = trek.route;
		if (!route) {
			this.error = 'gps.needRoute';
			this.mode = 'off';
			this.timeline = null;
			return;
		}
		this.mode = 'sim';
		this.imported = null;
		this.timeline = simulateRoute(route, this.startDate);
		this.syncRoute();
	}

	stop() {
		this.reset();
		this.mode = 'off';
		this.timeline = null;
		this.imported = null;
		this.live = null;
	}

	setClock(t: number) {
		if (!this.timeline) return;
		this.clock = Math.min(this.timeline.duration, Math.max(0, t));
		this.syncRoute();
	}

	private syncRoute() {
		const km = this.fix?.km;
		if (this.mode === 'sim' && km !== null && km !== undefined) trek.setScrub(km);
	}

	play() {
		if (!this.timeline || this.mode === 'live') return;
		trek.playing = false;
		if (this.atEnd) this.clock = 0;
		this.playing = true;
		this.follow = true;
		let last = performance.now();
		const tick = (now: number) => {
			const dt = Math.min(0.25, (now - last) / 1000);
			last = now;
			this.setClock(this.clock + dt * this.rate);
			if (this.atEnd) {
				this.playing = false;
				return;
			}
			this.frame = requestAnimationFrame(tick);
		};
		this.frame = requestAnimationFrame(tick);
	}

	pause() {
		this.playing = false;
		cancelAnimationFrame(this.frame);
	}

	toggle() {
		if (this.playing) this.pause();
		else this.play();
	}

	// ---- GPX -------------------------------------------------------------

	exportGpx() {
		const route = trek.route;
		if (!route || !this.timeline || this.timeline.kind !== 'simulated') return;
		const xml = toGpx(route, this.timeline, trek.placeById);
		const url = URL.createObjectURL(new Blob([xml], { type: 'application/gpx+xml' }));
		const a = document.createElement('a');
		a.href = url;
		a.download = `kilispatial-${route.id}-simulated.gpx`;
		a.click();
		setTimeout(() => URL.revokeObjectURL(url), 1000);
	}

	async importGpx(file: File) {
		this.reset();
		try {
			const track = parseGpx(await file.text(), file.name.replace(/\.gpx$/i, ''));
			this.imported = track;
			this.timeline = track.timeline;
			this.mode = 'import';
			this.follow = true;
			trek.scrubKm = null;
		} catch (err) {
			this.error = err instanceof Error && err.message.startsWith('gps.') ? (err.message as Key) : 'gps.errUnreadable';
		}
	}

	// ---- Device location ---------------------------------------------------

	startLive() {
		this.reset();
		if (!('geolocation' in navigator)) {
			this.error = 'gps.errNoGeo';
			return;
		}
		this.mode = 'live';
		this.timeline = null;
		this.imported = null;
		this.follow = true;
		let lastHeading = 0;
		this.watchId = navigator.geolocation.watchPosition(
			(pos) => {
				const c = pos.coords;
				if (c.heading !== null && !Number.isNaN(c.heading)) lastHeading = c.heading;
				this.live = {
					lng: c.longitude,
					lat: c.latitude,
					ele: c.altitude ?? NaN,
					t: 0,
					time: new Date(pos.timestamp),
					speedKmh: (c.speed ?? 0) * 3.6,
					heading: lastHeading,
					accuracy: Math.round(c.accuracy),
					km: null,
					day: null,
					moving: (c.speed ?? 0) > 0.3
				};
			},
			(err) => {
				this.stop();
				this.error = err.code === err.PERMISSION_DENIED ? 'gps.errDenied' : 'gps.errFailed';
			},
			{ enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 }
		);
	}

	private stopLive() {
		if (this.watchId !== null) navigator.geolocation.clearWatch(this.watchId);
		this.watchId = null;
	}
}

export const gps = new GpsState();
