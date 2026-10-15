import { browser } from '$app/env';
import en, { routes as enRoutes, type Dict, type Key, type RouteText } from './en.ts';
import sw, { routes as swRoutes } from './sw.ts';
import it, { routes as itRoutes } from './it.ts';
import fr, { routes as frRoutes } from './fr.ts';
import de, { routes as deRoutes } from './de.ts';

export const LANGS = [
	{ code: 'en', name: 'English' },
	{ code: 'sw', name: 'Kiswahili' },
	{ code: 'it', name: 'Italiano' },
	{ code: 'fr', name: 'Français' },
	{ code: 'de', name: 'Deutsch' }
] as const;
export type Lang = (typeof LANGS)[number]['code'];

const DICTS: Record<Lang, { dict: Dict; routes: RouteText }> = {
	en: { dict: en, routes: enRoutes },
	sw: { dict: sw, routes: swRoutes },
	it: { dict: it, routes: itRoutes },
	fr: { dict: fr, routes: frRoutes },
	de: { dict: de, routes: deRoutes }
};

const STORAGE_KEY = 'kilispatial.lang';
const isLang = (v: unknown): v is Lang => LANGS.some((l) => l.code === v);

function detect(): Lang {
	const fromUrl = new URLSearchParams(location.search).get('lang');
	if (isLang(fromUrl)) return fromUrl;
	try {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (isLang(saved)) return saved;
	} catch {
		/* storage unavailable */
	}
	for (const tag of navigator.languages ?? [navigator.language]) {
		const code = tag.slice(0, 2).toLowerCase();
		if (isLang(code)) return code;
	}
	return 'en';
}

class I18n {
	lang = $state<Lang>('en');

	init() {
		this.set(detect(), false);
	}

	set(lang: Lang, persist = true) {
		this.lang = lang;
		document.documentElement.lang = lang;
		if (persist) {
			try {
				localStorage.setItem(STORAGE_KEY, lang);
			} catch {
				/* ignore */
			}
		}
	}

	t(key: Key, vars?: Record<string, string | number>): string {
		let s = DICTS[this.lang].dict[key] ?? en[key];
		if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
		return s;
	}

	route(id: string) {
		return DICTS[this.lang].routes[id] ?? enRoutes[id];
	}

	/** Number formatting follows the chosen language. */
	n(value: number) {
		return value.toLocaleString(this.lang === 'sw' ? 'en' : this.lang);
	}
}

export const i18n = new I18n();
export const t = (key: Key, vars?: Record<string, string | number>) => i18n.t(key, vars);
if (browser) i18n.init();
