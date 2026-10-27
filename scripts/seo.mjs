/**
 * Generates the crawlable pages and sitemap into static/ before each build:
 * a hub and one guide page per route, in every language, as plain fast HTML
 * (no JavaScript) with titles, descriptions, Open Graph and structured data.
 * The interactive viewer itself is the SvelteKit app at "/".
 *
 *   node scripts/seo.mjs            (SITE_URL overrides the default origin)
 */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = (process.env.SITE_URL ?? 'https://kili.xenohuru.com').replace(/\/$/, '');
const REPO = 'https://github.com/cleven12/kili-spatial';
const LANGS = ['en', 'sw', 'it', 'fr', 'de'];
const LOCALE = { en: 'en_US', sw: 'sw_TZ', it: 'it_IT', fr: 'fr_FR', de: 'de_DE' };
const NAMES = { en: 'English', sw: 'Kiswahili', it: 'Italiano', fr: 'Français', de: 'Deutsch' };

const dicts = {};
for (const l of LANGS) {
	const m = await import(join(root, `src/lib/i18n/${l}.ts`));
	dicts[l] = { d: m.default, routes: m.routes };
}

/** Strings only the guide pages need. */
const X = {
	en: {
		guideTitle: '{t}: 3D map, itinerary and elevation',
		hubTitle: 'Kilimanjaro routes in 3D: Marangu, Machame, Lemosho and more',
		cta: 'Explore the {name} route in 3D',
		ctaHub: 'Open the interactive 3D map',
		other: 'Other Kilimanjaro routes',
		high: 'Highest point',
		day: 'Day',
		guides: 'Route guides',
		home: 'KiliSpatial',
		hubH1: 'Kilimanjaro trekking routes in 3D',
		hubLead: 'Compare every route up Mount Kilimanjaro on real terrain: distance, ascent, camps, huts and day-by-day itineraries.',
		free: 'Free, open source, no sign-up.',
		credit: 'Dev by'
	},
	sw: {
		guideTitle: '{t}: ramani ya 3D, ratiba na mwinuko',
		hubTitle: 'Njia za Kilimanjaro kwa 3D: Marangu, Machame, Lemosho na zaidi',
		cta: 'Chunguza njia ya {name} kwa 3D',
		ctaHub: 'Fungua ramani shirikishi ya 3D',
		other: 'Njia nyingine za Kilimanjaro',
		high: 'Sehemu ya juu zaidi',
		day: 'Siku',
		guides: 'Mwongozo wa njia',
		home: 'KiliSpatial',
		hubH1: 'Njia za kupanda Kilimanjaro kwa 3D',
		hubLead: 'Linganisha kila njia ya Mlima Kilimanjaro kwenye ardhi halisi: umbali, mwinuko, kambi, nyumba za wageni na ratiba ya kila siku.',
		free: 'Bure, chanzo huria, bila kujisajili.',
		credit: 'Imetengenezwa na'
	},
	it: {
		guideTitle: '{t}: mappa 3D, itinerario e altimetria',
		hubTitle: 'Vie del Kilimangiaro in 3D: Marangu, Machame, Lemosho e altre',
		cta: 'Esplora la via {name} in 3D',
		ctaHub: 'Apri la mappa 3D interattiva',
		other: 'Altre vie del Kilimangiaro',
		high: 'Punto più alto',
		day: 'Giorno',
		guides: 'Guide alle vie',
		home: 'KiliSpatial',
		hubH1: 'Le vie di trekking del Kilimangiaro in 3D',
		hubLead: 'Confronta ogni via del Kilimangiaro su terreno reale: distanza, dislivello, campi, rifugi e itinerario giorno per giorno.',
		free: 'Gratuito, open source, senza registrazione.',
		credit: 'Sviluppato da'
	},
	fr: {
		guideTitle: '{t} : carte 3D, itinéraire et dénivelé',
		hubTitle: 'Voies du Kilimandjaro en 3D : Marangu, Machame, Lemosho et plus',
		cta: 'Explorer la voie {name} en 3D',
		ctaHub: 'Ouvrir la carte 3D interactive',
		other: 'Autres voies du Kilimandjaro',
		high: 'Point culminant',
		day: 'Jour',
		guides: 'Guides des voies',
		home: 'KiliSpatial',
		hubH1: 'Les voies de trekking du Kilimandjaro en 3D',
		hubLead: 'Comparez chaque voie du Kilimandjaro sur un vrai relief : distance, dénivelé, camps, refuges et itinéraire jour par jour.',
		free: 'Gratuit, open source, sans inscription.',
		credit: 'Développé par'
	},
	de: {
		guideTitle: '{t}: 3D-Karte, Reiseplan und Höhenprofil',
		hubTitle: 'Kilimandscharo-Routen in 3D: Marangu, Machame, Lemosho und mehr',
		cta: '{name}-Route in 3D erkunden',
		ctaHub: 'Interaktive 3D-Karte öffnen',
		other: 'Weitere Kilimandscharo-Routen',
		high: 'Höchster Punkt',
		day: 'Tag',
		guides: 'Routenführer',
		home: 'KiliSpatial',
		hubH1: 'Die Trekkingrouten am Kilimandscharo in 3D',
		hubLead: 'Vergleiche jede Route auf den Kilimandscharo auf echtem Gelände: Distanz, Aufstieg, Camps, Hütten und Tagesetappen.',
		free: 'Kostenlos, Open Source, ohne Anmeldung.',
		credit: 'Entwickelt von'
	}
};

const fill = (s, v = {}) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ''));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const num = (lang, n) => new Intl.NumberFormat(lang).format(Math.round(n));

const index = JSON.parse(await readFile(join(root, 'static/data/index.json'), 'utf8'));
const places = new Map(JSON.parse(await readFile(join(root, 'static/data/places.json'), 'utf8')).map((p) => [p.id, p]));
const routes = {};
for (const r of index) routes[r.id] = JSON.parse(await readFile(join(root, `static/data/routes/${r.id}.json`), 'utf8'));

const prefix = (l) => (l === 'en' ? '' : `/${l}`);
const hubPath = (l) => `${prefix(l)}/routes/`;
const guidePath = (l, id) => `${prefix(l)}/routes/${id}/`;
const appUrl = (l, id) => `/?${id ? `route=${id}&` : ''}lang=${l}`;
const abs = (p) => SITE + p;

const CSS = `:root{--paper:#f4eee2;--paper2:#e9e1cf;--ink:#1f1b16;--soft:#62594b;--rule:#d3c8b2;--ochre:#c4571f}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.6 Verdana,Geneva,'DejaVu Sans',sans-serif}
a{color:inherit;text-decoration-color:var(--rule);text-underline-offset:4px}a:hover{color:var(--ochre)}
.wrap{max-width:46rem;margin:0 auto;padding:0 1.25rem}
header.top{border-bottom:1px solid var(--rule)}header.top .wrap{display:flex;flex-wrap:wrap;gap:.5rem 1.25rem;align-items:center;justify-content:space-between;padding:.8rem 1.25rem}
.brand{font-weight:700;text-decoration:none;letter-spacing:.01em}.langs{display:flex;gap:.75rem;font-size:.85rem}.langs [aria-current]{font-weight:700;text-decoration:none}
nav.crumbs{font-size:.8rem;color:var(--soft);padding:1rem 0 0}h1{font-size:clamp(1.8rem,5vw,2.6rem);line-height:1.1;margin:.5rem 0 .25rem}
.sub{color:var(--soft);margin:0 0 1rem}.cta{display:inline-block;background:var(--ink);color:#fff;padding:.75rem 1.1rem;text-decoration:none;font-weight:700;margin:.5rem 0 1.25rem}
.cta:hover{background:var(--ochre);color:#fff}.hero{width:100%;height:auto;display:block;border:1px solid var(--rule);margin:.5rem 0 1rem}
dl.facts{display:grid;grid-template-columns:repeat(2,1fr);gap:0;margin:1.25rem 0;border-block:1px solid var(--rule)}
@media(min-width:34rem){dl.facts{grid-template-columns:repeat(4,1fr)}}
dl.facts div{padding:.6rem .75rem .6rem 0}dt{font-size:.72rem;text-transform:uppercase;letter-spacing:.06em;color:var(--soft)}dd{margin:0;font-size:1.25rem;font-weight:700}
h2{font-size:1.25rem;margin:2rem 0 .5rem}ol.days{padding:0;list-style:none;border-top:1px solid var(--rule)}
ol.days li{padding:.7rem 0;border-bottom:1px solid var(--rule)}ol.days b{display:block}ol.days span{color:var(--soft);font-size:.88rem}
.note{border-left:3px solid var(--ochre);background:var(--paper2);padding:.6rem .9rem;font-size:.9rem;margin:1rem 0}
ul.routes{padding:0;list-style:none;display:grid;gap:.5rem;border-top:1px solid var(--rule)}ul.routes li{border-bottom:1px solid var(--rule);padding:.6rem 0}
ul.routes small{display:block;color:var(--soft)}footer{margin-top:3rem;border-top:1px solid var(--rule);padding:1.25rem 0 2.5rem;font-size:.82rem;color:var(--soft)}`;

function head({ lang, title, desc, path, jsonld, alternates, noindex }) {
	const url = abs(path);
	return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} | KiliSpatial</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
${alternates.map(([l, p]) => `<link rel="alternate" hreflang="${l}" href="${abs(p)}">`).join('\n')}
<link rel="icon" href="/favicon.svg">
<meta name="theme-color" content="#f4eee2">
${noindex ? '<meta name="robots" content="noindex">' : '<meta name="robots" content="index,follow,max-image-preview:large">'}
<meta property="og:type" content="website">
<meta property="og:site_name" content="KiliSpatial">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/og.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="${LOCALE[lang]}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${SITE}/og.jpg">
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
<style>${CSS}</style>
</head>`;
}

function chrome(lang, altPaths, inner, crumbs) {
	const x = X[lang];
	return `<body>
<header class="top"><div class="wrap">
<a class="brand" href="${hubPath(lang) === '/routes/' ? '/routes/' : hubPath(lang)}">KiliSpatial</a>
<div class="langs" aria-label="Language">${LANGS.map((l) => `<a href="${altPaths[l]}" hreflang="${l}" lang="${l}"${l === lang ? ' aria-current="page"' : ''}>${NAMES[l]}</a>`).join('')}</div>
</div></header>
<main class="wrap">
<nav class="crumbs" aria-label="Breadcrumb">${crumbs}</nav>
${inner}
</main>
<footer><div class="wrap">
<p>${esc(dicts[lang].d['about.notNavStrong'])} ${esc(dicts[lang].d['about.notNav'])}</p>
<p>${x.credit} <a href="${REPO}" rel="noopener">Cleven G</a> · <a href="${REPO}" rel="noopener">GitHub</a> · AGPL-3.0 · Data © <a href="https://www.openstreetmap.org/copyright" rel="noopener">OpenStreetMap contributors</a> (ODbL)</p>
</div></footer>
</body>
</html>
`;
}

const written = [];
async function out(path, html) {
	const file = join(root, 'static', path, 'index.html');
	await mkdir(dirname(file), { recursive: true });
	await writeFile(file, html);
	written.push(path);
}

// Fresh output every run so removed routes do not linger.
for (const l of LANGS) await rm(join(root, 'static', prefix(l), 'routes'), { recursive: true, force: true });
for (const l of LANGS.filter((l) => l !== 'en')) await rm(join(root, 'static', l), { recursive: true, force: true });

for (const lang of LANGS) {
	const { d, routes: rt } = dicts[lang];
	const x = X[lang];
	const t = (k, v) => fill(d[k], v);
	const hubAlt = Object.fromEntries(LANGS.map((l) => [l, hubPath(l)]));

	// Hub
	{
		const title = x.hubTitle;
		const desc = `${x.hubLead} ${x.free}`;
		const list = index
			.map(
				(r) => `<li><a href="${guidePath(lang, r.id)}"><b>${esc(t('site.routeTitle', { name: r.name }))}</b></a><small>${esc(rt[r.id].nickname)} · ${esc(t('itinerary.daysKm', { days: r.durationDays }))} · ${num(lang, r.distanceKm)} km · ${esc(rt[r.id].summary)}</small></li>`
			)
			.join('\n');
		const html =
			head({
				lang,
				title,
				desc,
				path: hubPath(lang),
				alternates: [...LANGS.map((l) => [l, hubPath(l)]), ['x-default', hubPath('en')]],
				jsonld: {
					'@context': 'https://schema.org',
					'@graph': [
						{
							'@type': 'CollectionPage',
							name: title,
							description: desc,
							url: abs(hubPath(lang)),
							inLanguage: lang,
							mainEntity: { '@type': 'ItemList', itemListElement: index.map((r, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(guidePath(lang, r.id)), name: t('site.routeTitle', { name: r.name }) })) }
						},
						{
							'@type': 'WebApplication',
							name: 'KiliSpatial',
							url: SITE + '/',
							applicationCategory: 'TravelApplication',
							operatingSystem: 'Any (web browser)',
							isAccessibleForFree: true,
							offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
							author: { '@type': 'Person', name: 'Cleven G', url: 'https://github.com/cleven12' },
							license: 'https://www.gnu.org/licenses/agpl-3.0.html',
							inLanguage: LANGS
						}
					]
				}
			}) +
			chrome(
				lang,
				hubAlt,
				`<h1>${esc(x.hubH1)}</h1>
<p class="sub">${esc(x.hubLead)} ${esc(x.free)}</p>
<img class="hero" src="/og.jpg" width="1200" height="630" alt="${esc(x.hubH1)}" fetchpriority="high">
<a class="cta" href="${appUrl(lang)}">${esc(x.ctaHub)}</a>
<h2>${esc(x.guides)}</h2>
<ul class="routes">
${list}
</ul>`,
				`<a href="${abs('/')}">${x.home}</a> › ${esc(x.guides)}`
			);
		await out(hubPath(lang), html);
	}

	// One guide per route
	for (const r of index) {
		const route = routes[r.id];
		const name = t('site.routeTitle', { name: r.name });
		const title = fill(x.guideTitle, { t: name });
		const rtxt = rt[r.id];
		const stats = `${t('itinerary.daysKm', { days: r.durationDays })}, ${num(lang, r.distanceKm)} km, +${num(lang, route.stats.ascentM)} m`;
		const desc = `${rtxt.nickname}. ${rtxt.summary} ${stats}. ${x.free}`;
		const alt = Object.fromEntries(LANGS.map((l) => [l, guidePath(l, r.id)]));
		const placeName = (id) => places.get(id)?.name ?? id;
		const days = route.days
			.map(
				(day) =>
					`<li><b>${x.day} ${day.day}: ${esc(placeName(day.from))} → ${esc(placeName(day.to))}</b><span>${esc(t('itinerary.dayStats', { km: day.distanceKm.toFixed(1), up: num(lang, day.ascentM), down: num(lang, day.descentM), end: num(lang, day.endElevation) }))}</span></li>`
			)
			.join('\n');
		const others = index
			.filter((o) => o.id !== r.id)
			.map((o) => `<li><a href="${guidePath(lang, o.id)}"><b>${esc(t('site.routeTitle', { name: o.name }))}</b></a><small>${esc(rt[o.id].nickname)} · ${esc(t('itinerary.daysKm', { days: o.durationDays }))} · ${num(lang, o.distanceKm)} km</small></li>`)
			.join('\n');
		const caution = r.unverified ? `<p class="note">${esc(t('masthead.indicative'))} ${esc(t('masthead.daySplit'))}</p>` : '';
		const html =
			head({
				lang,
				title,
				desc,
				path: guidePath(lang, r.id),
				alternates: [...LANGS.map((l) => [l, guidePath(l, r.id)]), ['x-default', guidePath('en', r.id)]],
				jsonld: {
					'@context': 'https://schema.org',
					'@graph': [
						{
							'@type': 'TouristTrip',
							name,
							description: `${rtxt.nickname}. ${rtxt.summary}`,
							url: abs(guidePath(lang, r.id)),
							inLanguage: lang,
							touristType: 'Trekking',
							itinerary: {
								'@type': 'ItemList',
								itemListElement: route.days.map((day) => ({
									'@type': 'ListItem',
									position: day.day,
									name: `${x.day} ${day.day}: ${placeName(day.from)} → ${placeName(day.to)}`
								}))
							}
						},
						{
							'@type': 'BreadcrumbList',
							itemListElement: [
								{ '@type': 'ListItem', position: 1, name: 'KiliSpatial', item: abs('/') },
								{ '@type': 'ListItem', position: 2, name: x.guides, item: abs(hubPath(lang)) },
								{ '@type': 'ListItem', position: 3, name, item: abs(guidePath(lang, r.id)) }
							]
						}
					]
				}
			}) +
			chrome(
				lang,
				alt,
				`<h1>${esc(name)}</h1>
<p class="sub">${esc(rtxt.nickname)} · ${esc(r.accommodation === 'huts' ? d['masthead.huts'] : d['masthead.camping'])}</p>
<p>${esc(rtxt.summary)}</p>
<a class="cta" href="${appUrl(lang, r.id)}">${esc(fill(x.cta, { name: r.name }))}</a>
<dl class="facts">
<div><dt>${esc(d['fact.days'])}</dt><dd>${r.durationDays}</dd></div>
<div><dt>${esc(d['fact.distance'])}</dt><dd>${num(lang, r.distanceKm)} km</dd></div>
<div><dt>${esc(d['fact.ascent'])}</dt><dd>${num(lang, route.stats.ascentM)} m</dd></div>
<div><dt>${esc(x.high)}</dt><dd>${num(lang, route.stats.maxElevation)} m</dd></div>
</dl>
${caution}
<h2>${esc(d['itinerary.title'])}</h2>
<ol class="days">
${days}
</ol>
<a class="cta" href="${appUrl(lang, r.id)}">${esc(fill(x.cta, { name: r.name }))}</a>
<h2>${esc(x.other)}</h2>
<ul class="routes">
${others}
</ul>`,
				`<a href="${abs('/')}">${x.home}</a> › <a href="${hubPath(lang)}">${esc(x.guides)}</a> › ${esc(name)}`
			);
		await out(guidePath(lang, r.id), html);
	}
}

// 404 page, so unknown URLs return a real 404 instead of the app.
await writeFile(
	join(root, 'static/404.html'),
	`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Page not found | KiliSpatial</title><style>${CSS}</style></head><body><main class="wrap"><h1>Page not found</h1><p class="sub">That page does not exist.</p><a class="cta" href="/">Open the 3D map</a> <a href="/routes/">Route guides</a></main></body></html>`
);

// Sitemap with language alternates
const today = new Date().toISOString().slice(0, 10);
const entry = (paths) =>
	LANGS.map(
		(l) => `<url><loc>${abs(paths[l])}</loc><lastmod>${today}</lastmod>${[...LANGS.map((a) => [a, paths[a]]), ['x-default', paths.en]].map(([a, p]) => `<xhtml:link rel="alternate" hreflang="${a}" href="${abs(p)}"/>`).join('')}</url>`
	).join('\n');
const urls = [
	`<url><loc>${abs('/')}</loc><lastmod>${today}</lastmod><priority>1.0</priority></url>`,
	entry(Object.fromEntries(LANGS.map((l) => [l, hubPath(l)]))),
	...index.map((r) => entry(Object.fromEntries(LANGS.map((l) => [l, guidePath(l, r.id)]))))
];
await writeFile(
	join(root, 'static/sitemap.xml'),
	`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`
);
await writeFile(join(root, 'static/robots.txt'), `User-agent: *\nAllow: /\nDisallow: /embed\n\nSitemap: ${SITE}/sitemap.xml\n`);

console.log(`seo: ${written.length} pages, sitemap.xml, robots.txt (${SITE})`);
