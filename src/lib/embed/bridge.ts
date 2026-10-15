import { EMBED_ORIGINS } from '#lib/config.ts';
import { i18n, LANGS, type Lang } from '#lib/i18n/index.svelte.ts';
import { trek } from '#lib/state/trek.svelte.ts';

/**
 * postMessage API between the embedded viewer and its host page.
 * Every message carries `source: 'kilispatial'` and `version: 1`.
 * Messages are only accepted from the direct parent window, and only when its
 * origin is on the allowlist (VITE_EMBED_ORIGINS). The viewer only replies to
 * that origin, never to '*'.
 */
export const PROTOCOL = { source: 'kilispatial', version: 1 } as const;

export type Command =
	| { type: 'selectRoute'; id: string | null }
	| { type: 'focusDay'; day: number }
	| { type: 'focusPlace'; id: string }
	| { type: 'showRoute' }
	| { type: 'drone'; on: boolean }
	| { type: 'play'; on: boolean }
	| { type: 'scrub'; km: number | null }
	| { type: 'setLang'; lang: Lang };

export type Event =
	| { type: 'ready'; routes: { id: string; name: string; days: number }[] }
	| { type: 'route'; id: string | null }
	| { type: 'day'; day: number | null }
	| { type: 'place'; id: string | null }
	| { type: 'progress'; km: number | null; elevation: number };

function isCommand(d: unknown): d is Command {
	if (typeof d !== 'object' || d === null) return false;
	const m = d as Record<string, unknown>;
	if (m.source !== PROTOCOL.source || typeof m.type !== 'string') return false;
	switch (m.type) {
		case 'selectRoute':
			return m.id === null || typeof m.id === 'string';
		case 'focusDay':
			return typeof m.day === 'number' && Number.isInteger(m.day);
		case 'focusPlace':
			return typeof m.id === 'string';
		case 'showRoute':
			return true;
		case 'drone':
		case 'play':
			return typeof m.on === 'boolean';
		case 'scrub':
			return m.km === null || typeof m.km === 'number';
		case 'setLang':
			return LANGS.some((l) => l.code === m.lang);
		default:
			return false;
	}
}

function guessParentOrigin(): string | null {
	const fromAncestors = (location.ancestorOrigins as DOMStringList | undefined)?.[0];
	let ref = '';
	try {
		ref = document.referrer ? new URL(document.referrer).origin : '';
	} catch {
		/* ignore */
	}
	const candidate = fromAncestors || ref;
	return candidate && EMBED_ORIGINS.includes(candidate) ? candidate : null;
}

export function apply(cmd: Command) {
	switch (cmd.type) {
		case 'selectRoute':
			if (cmd.id === null || trek.routes[cmd.id]) trek.selectRoute(cmd.id);
			break;
		case 'focusDay':
			if (trek.route?.days.some((d) => d.day === cmd.day)) trek.focusDay(cmd.day);
			break;
		case 'focusPlace':
			if (trek.placeById.has(cmd.id)) trek.focusPlace(cmd.id);
			break;
		case 'showRoute':
			trek.showRoute();
			break;
		case 'drone':
			if (trek.drone !== cmd.on) trek.toggleDrone();
			break;
		case 'play':
			if (trek.playing !== cmd.on) trek.togglePlay();
			break;
		case 'scrub':
			trek.setScrub(cmd.km);
			break;
		case 'setLang':
			i18n.set(cmd.lang);
			break;
	}
}

/**
 * Start listening for commands. Returns `emit` (send an event to the parent) and a
 * cleanup function. `emit` is a no-op until the parent's origin is known and allowed.
 */
export function startBridge() {
	let parentOrigin = guessParentOrigin();
	const inFrame = window.parent !== window;

	const emit = (event: Event) => {
		if (!inFrame || !parentOrigin) return;
		window.parent.postMessage({ ...PROTOCOL, ...event }, parentOrigin);
	};

	const onMessage = (e: MessageEvent) => {
		if (!inFrame || e.source !== window.parent || !EMBED_ORIGINS.includes(e.origin)) return;
		if (!isCommand(e.data)) return;
		parentOrigin = e.origin;
		apply(e.data);
	};
	window.addEventListener('message', onMessage);
	return { emit, stop: () => window.removeEventListener('message', onMessage) };
}
