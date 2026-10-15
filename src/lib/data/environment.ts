import type { Key } from '#lib/i18n/en.ts';

/** Altitude-derived estimates shown in the readout (not measurements). */

/**
 * Fraction of sea-level oxygen available, from the standard barometric
 * formula (about 48% at the summit).
 */
export function oxygenAtElevation(m: number): number {
	return Math.round(100 * Math.pow(1 - 2.25577e-5 * m, 5.25588));
}

export function vegetationAt(m: number): Key {
	if (m < 2800) return 'veg.forest';
	if (m < 4000) return 'veg.moorland';
	if (m < 5000) return 'veg.desert';
	return 'veg.summit';
}

export interface Weather {
	label: Key;
	tempC: number;
	windKph: number;
}

/** Deterministic, elevation-based weather simulation. */
export function weatherAt(m: number): Weather {
	const tempC = Math.round(24 - 6.5 * ((m - 1000) / 1000));
	if (m < 2800) return { label: 'wx.mist', tempC, windKph: 6 };
	if (m < 4000) return { label: 'wx.breezy', tempC, windKph: 18 };
	if (m < 5000) return { label: 'wx.cold', tempC, windKph: 26 };
	return { label: 'wx.freezing', tempC, windKph: 42 };
}
