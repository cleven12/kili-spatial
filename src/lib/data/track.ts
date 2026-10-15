import type { Route } from '#lib/types.ts';

const R = 6371008.8;
const rad = (d: number) => (d * Math.PI) / 180;

function haversineKm(a: readonly number[], b: readonly number[]): number {
	const dLat = rad(b[1] - a[1]);
	const dLon = rad(b[0] - a[0]);
	const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLon / 2) ** 2;
	return (2 * R * Math.asin(Math.sqrt(h))) / 1000;
}

function bearing(a: readonly number[], b: readonly number[]): number {
	const y = Math.sin(rad(b[0] - a[0])) * Math.cos(rad(b[1]));
	const x =
		Math.cos(rad(a[1])) * Math.sin(rad(b[1])) -
		Math.sin(rad(a[1])) * Math.cos(rad(b[1])) * Math.cos(rad(b[0] - a[0]));
	return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export interface TrackPosition {
	lng: number;
	lat: number;
	ele: number;
	bearing: number;
	km: number;
}

/** Distance-indexed view of a route polyline: position, elevation and slicing by km. */
export class Track {
	readonly km: number[];
	readonly total: number;

	constructor(readonly route: Route) {
		const c = route.coordinates;
		this.km = [0];
		for (let i = 1; i < c.length; i++) this.km.push(this.km[i - 1] + haversineKm(c[i - 1], c[i]));
		this.total = this.km[this.km.length - 1];
	}

	clamp(km: number): number {
		return Math.min(this.total, Math.max(0, km));
	}

	/** Index of the first vertex at or beyond `km` (binary search). */
	private upper(km: number): number {
		let lo = 1;
		let hi = this.km.length - 1;
		while (lo < hi) {
			const mid = (lo + hi) >> 1;
			if (this.km[mid] >= km) hi = mid;
			else lo = mid + 1;
		}
		return lo;
	}

	pointAt(km: number): TrackPosition {
		const d = this.clamp(km);
		const i = this.upper(d);
		const a = this.route.coordinates[i - 1];
		const b = this.route.coordinates[i];
		const span = this.km[i] - this.km[i - 1];
		const t = span === 0 ? 0 : (d - this.km[i - 1]) / span;
		return {
			lng: a[0] + (b[0] - a[0]) * t,
			lat: a[1] + (b[1] - a[1]) * t,
			ele: a[2] + (b[2] - a[2]) * t,
			bearing: bearing(a, b),
			km: d
		};
	}

	elevationAt(km: number): number {
		return this.pointAt(km).ele;
	}

	/** Route polyline from the start up to `km`. */
	coordinatesUpTo(km: number): [number, number][] {
		return this.coordinatesBetween(0, km);
	}

	/** Route polyline between two km marks (inclusive). */
	coordinatesBetween(startKm: number, endKm: number): [number, number][] {
		const s = this.pointAt(startKm);
		const e = this.pointAt(endKm);
		const out: [number, number][] = [[s.lng, s.lat]];
		for (let i = 0; i < this.km.length; i++) {
			if (this.km[i] > startKm && this.km[i] < endKm) {
				const c = this.route.coordinates[i];
				out.push([c[0], c[1]]);
			}
		}
		out.push([e.lng, e.lat]);
		return out;
	}
}
