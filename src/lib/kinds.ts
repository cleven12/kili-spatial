import { BedDouble, DoorOpen, House, Mountain, Tent } from 'lucide-svelte';
import type { PlaceKind } from '#lib/types.ts';

/**
 * Pin colours from the Okabe-Ito palette, which stays distinguishable under the
 * common kinds of colour blindness. Each kind also has its own icon, so colour is
 * never the only cue.
 */
export const KIND_STYLE = {
	gate: { bg: '#0072B2', fg: '#ffffff', Icon: DoorOpen },
	camp: { bg: '#E69F00', fg: '#1f1b16', Icon: Tent },
	hut: { bg: '#009E73', fg: '#ffffff', Icon: House },
	summit: { bg: '#D55E00', fg: '#ffffff', Icon: Mountain },
	lodging: { bg: '#CC79A7', fg: '#1f1b16', Icon: BedDouble }
} as const satisfies Record<PlaceKind, { bg: string; fg: string; Icon: unknown }>;
