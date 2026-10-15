<script lang="ts">
	import { onMount, mount, unmount, untrack } from 'svelte';
	import { browser } from '$app/env';
	import type {
		GeoJSONSource,
		LngLatBoundsLike,
		Map as MapLibreMap,
		MapLayerMouseEvent,
		Marker,
		StyleSpecification
	} from 'maplibre-gl';
	import { trek } from '#lib/state/trek.svelte.ts';
	import type { Place } from '#lib/types.ts';
	import WaypointMarker from './WaypointMarker.svelte';

	const EXAGGERATION = 1.3;
	const HOME = { center: [37.36, -3.1] as [number, number], pitch: 60, bearing: -20, zoom: 10.6 };
	const PADDING = { top: 70, left: 50, right: 50, bottom: 280 };
	const ORBIT_DEG_PER_SEC = 5;

	let container: HTMLDivElement;
	let map: MapLibreMap | undefined;
	let maplibre: typeof import('maplibre-gl') | undefined;
	let ready = $state(false);
	let markers: { remove: () => void }[] = [];
	let scrubMarker: Marker | undefined;
	let scrubShown = false;
	let orbitFrame = 0;
	let flyFrame = 0;

	const prefersReducedMotion = () =>
		browser && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	const emptyLine: GeoJSON.Feature = {
		type: 'Feature',
		properties: {},
		geometry: { type: 'LineString', coordinates: [] }
	};
	const emptyCollection: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };

	const style: StyleSpecification = {
		version: 8,
		glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
		sources: {
			imagery: {
				type: 'raster',
				tiles: [
					'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
				],
				tileSize: 256,
				maxzoom: 17,
				attribution: 'Imagery © Esri, Maxar, Earthstar Geographics'
			},
			terrainSource: {
				type: 'raster-dem',
				tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
				tileSize: 256,
				maxzoom: 14,
				encoding: 'terrarium',
				attribution: 'Terrain: Mapzen / AWS Terrain Tiles · Routes: © OpenStreetMap contributors'
			},
			hillshadeSource: {
				type: 'raster-dem',
				tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
				tileSize: 256,
				maxzoom: 14,
				encoding: 'terrarium'
			}
		},
		layers: [
			{ id: 'bg', type: 'background', paint: { 'background-color': '#ebe3d2' } },
			{
				id: 'imagery',
				type: 'raster',
				source: 'imagery',
				paint: {
					'raster-brightness-max': 0.86,
					'raster-saturation': -0.4,
					'raster-contrast': 0.1
				}
			},
			{
				id: 'hillshade',
				type: 'hillshade',
				source: 'hillshadeSource',
				paint: {
					'hillshade-exaggeration': 0.5,
					'hillshade-shadow-color': '#2b2418',
					'hillshade-highlight-color': '#fff6e3',
					'hillshade-accent-color': '#3a2f1e'
				}
			}
		],
		sky: {
			'sky-color': '#a9bcc8',
			'horizon-color': '#efe6d3',
			'fog-color': '#e6dccb',
			'sky-horizon-blend': 0.6,
			'horizon-fog-blend': 0.75,
			'fog-ground-blend': 0.35,
			'atmosphere-blend': 0.8
		}
	};

	const shortestAngle = (from: number, to: number) => ((((to - from) % 360) + 540) % 360) - 180;
	const duration = (ms: number) => (prefersReducedMotion() ? 0 : ms);

	function stopOrbit() {
		cancelAnimationFrame(orbitFrame);
		orbitFrame = 0;
	}

	function stopFly() {
		cancelAnimationFrame(flyFrame);
		flyFrame = 0;
	}

	function startOrbit() {
		if (!map || prefersReducedMotion()) return;
		stopOrbit();
		let last = performance.now();
		const tick = (now: number) => {
			const dt = (now - last) / 1000;
			last = now;
			map!.setBearing(map!.getBearing() + ORBIT_DEG_PER_SEC * dt);
			orbitFrame = requestAnimationFrame(tick);
		};
		orbitFrame = requestAnimationFrame(tick);
	}

	function boundsOf(coords: [number, number][]): LngLatBoundsLike {
		const lons = coords.map((c) => c[0]);
		const lats = coords.map((c) => c[1]);
		return [
			[Math.min(...lons), Math.min(...lats)],
			[Math.max(...lons), Math.max(...lats)]
		];
	}

	/** Compass bearing from one point to another, so the camera faces the summit. */
	function bearingTo(from: [number, number], to: [number, number]): number {
		const r = (d: number) => (d * Math.PI) / 180;
		const y = Math.sin(r(to[0] - from[0])) * Math.cos(r(to[1]));
		const x =
			Math.cos(r(from[1])) * Math.sin(r(to[1])) -
			Math.sin(r(from[1])) * Math.cos(r(to[1])) * Math.cos(r(to[0] - from[0]));
		return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
	}

	function flyToPlace(place: Place) {
		if (!map) return;
		stopOrbit();
		const summit = trek.placeById.get('uhuru-peak');
		const heading =
			summit && summit.id !== place.id ? bearingTo(place.coordinates, summit.coordinates) : -45;
		map.flyTo({
			center: place.coordinates,
			zoom: place.kind === 'lodging' ? 14 : 14.5,
			pitch: 62,
			bearing: heading,
			duration: duration(3500),
			curve: 1.5,
			essential: true
		});
	}

	function setLine(id: string, coords: [number, number][]) {
		const src = map?.getSource(id) as GeoJSONSource | undefined;
		src?.setData({
			type: 'Feature',
			properties: {},
			geometry: { type: 'LineString', coordinates: coords.length > 1 ? coords : [] }
		});
	}

	function addLayers(m: MapLibreMap) {
		const round = { 'line-cap': 'round', 'line-join': 'round' } as const;
		m.addSource('routes-all', { type: 'geojson', data: emptyCollection });
		m.addSource('progress', { type: 'geojson', data: emptyLine });
		m.addSource('stage', { type: 'geojson', data: emptyLine });
		m.addSource('gaps', { type: 'geojson', data: emptyCollection });
		m.addSource('places', { type: 'geojson', data: emptyCollection });
		m.addSource('lodging', {
			type: 'geojson',
			data: emptyCollection,
			cluster: true,
			clusterRadius: 38,
			clusterMaxZoom: 13
		});

		// Routes not selected: faint dashed paper lines.
		m.addLayer({
			id: 'routes-bg',
			type: 'line',
			source: 'routes-all',
			layout: { 'line-join': 'round' },
			paint: { 'line-color': '#fbf6ea', 'line-width': 1.6, 'line-dasharray': [2, 2], 'line-opacity': 0.5 }
		});
		// Selected route: bolder dashed paper line, like a printed trail on a map.
		m.addLayer({
			id: 'route-core',
			type: 'line',
			source: 'routes-all',
			filter: ['==', ['get', 'id'], ''],
			layout: { 'line-join': 'round' },
			paint: { 'line-color': '#fbf6ea', 'line-width': 2.6, 'line-dasharray': [2, 1.6], 'line-opacity': 0.98 }
		});
		// Stretches that are not real trail in OSM data: dotted ochre.
		m.addLayer({
			id: 'gaps',
			type: 'line',
			source: 'gaps',
			paint: { 'line-color': '#c4571f', 'line-width': 3, 'line-dasharray': [0.5, 2] }
		});
		m.addLayer({ id: 'stage-casing', type: 'line', source: 'stage', layout: round, paint: { 'line-color': '#fbf6ea', 'line-width': 8 } });
		m.addLayer({ id: 'stage-core', type: 'line', source: 'stage', layout: round, paint: { 'line-color': '#c4571f', 'line-width': 4.5 } });
		m.addLayer({ id: 'progress-casing', type: 'line', source: 'progress', layout: round, paint: { 'line-color': '#fbf6ea', 'line-width': 7 } });
		m.addLayer({ id: 'progress-core', type: 'line', source: 'progress', layout: round, paint: { 'line-color': '#c4571f', 'line-width': 4 } });

		// Places that are not stops on the selected route.
		m.addLayer({
			id: 'places-dot',
			type: 'circle',
			source: 'places',
			filter: ['!', ['get', 'onRoute']],
			paint: {
				'circle-radius': 5,
				'circle-color': '#1f1b16',
				'circle-stroke-color': '#f4eee2',
				'circle-stroke-width': 2
			}
		});

		// Lodging, clustered; hidden until the toggle is on.
		const hidden = { visibility: 'none' } as const;
		m.addLayer({
			id: 'lodging-cluster',
			type: 'circle',
			source: 'lodging',
			filter: ['has', 'point_count'],
			layout: hidden,
			paint: {
				'circle-color': '#f4eee2',
				'circle-stroke-color': '#1f1b16',
				'circle-stroke-width': 1.5,
				'circle-radius': ['step', ['get', 'point_count'], 13, 10, 17, 30, 22]
			}
		});
		m.addLayer({
			id: 'lodging-count',
			type: 'symbol',
			source: 'lodging',
			filter: ['has', 'point_count'],
			layout: {
				...hidden,
				'text-field': ['get', 'point_count_abbreviated'],
				'text-font': ['Open Sans Semibold'],
				'text-size': 11
			},
			paint: { 'text-color': '#1f1b16' }
		});
		m.addLayer({
			id: 'lodging-point',
			type: 'circle',
			source: 'lodging',
			filter: ['!', ['has', 'point_count']],
			layout: hidden,
			paint: {
				'circle-radius': 5,
				'circle-color': '#f4eee2',
				'circle-stroke-color': '#1f1b16',
				'circle-stroke-width': 2
			}
		});

		for (const layer of ['places-dot', 'lodging-point', 'lodging-cluster']) {
			m.on('mouseenter', layer, () => (m.getCanvas().style.cursor = 'pointer'));
			m.on('mouseleave', layer, () => (m.getCanvas().style.cursor = ''));
		}
		const pickPlace = (e: MapLayerMouseEvent) => {
			const id = e.features?.[0]?.properties?.id;
			if (id) trek.focusPlace(String(id));
		};
		m.on('click', 'places-dot', pickPlace);
		m.on('click', 'lodging-point', pickPlace);
		m.on('click', 'lodging-cluster', async (e) => {
			const f = e.features?.[0];
			if (!f || f.geometry.type !== 'Point') return;
			const src = m.getSource('lodging') as GeoJSONSource;
			const zoom = await src.getClusterExpansionZoom(f.properties.cluster_id);
			m.easeTo({ center: f.geometry.coordinates as [number, number], zoom: zoom + 0.5, duration: duration(600) });
		});

		const dot = document.createElement('div');
		dot.className = 'scrub-dot';
		scrubMarker = new maplibre!.Marker({ element: dot });
	}

	onMount(() => {
		if (!browser) return;
		let disposed = false;

		(async () => {
			maplibre = await import('maplibre-gl');
			if (disposed) return;
			const m = new maplibre.Map({
				container,
				style,
				...HOME,
				maxPitch: 85,
				minZoom: 9,
				canvasContextAttributes: { antialias: true },
				attributionControl: { compact: true }
			});
			map = m;
			m.addControl(new maplibre.NavigationControl({ visualizePitch: true }), 'top-right');

			m.on('load', () => {
				m.setTerrain({ source: 'terrainSource', exaggeration: EXAGGERATION });
				addLayers(m);
				ready = true;
				trek.mapReady = true;
			});

			m.on('move', () => {
				if (trek.scrubKm !== null) return;
				const e = m.queryTerrainElevation(m.getCenter());
				if (e !== null) trek.viewElevation = e / EXAGGERATION;
			});

			// Any user-initiated gesture hands control back to the user.
			const release = () => {
				stopOrbit();
				if (trek.playing) trek.playing = false;
			};
			m.on('dragstart', release);
			m.on('wheel', release);
			m.on('touchstart', stopOrbit);
		})();

		return () => {
			disposed = true;
			stopOrbit();
			stopFly();
			markers.forEach((mk) => mk.remove());
			markers = [];
			scrubMarker?.remove();
			map?.remove();
			map = undefined;
			trek.mapReady = false;
		};
	});

	const dataReady = $derived(ready && trek.status === 'ready');

	// Push the dataset into map sources once both are ready.
	$effect(() => {
		if (!dataReady || !map) return;
		(map.getSource('routes-all') as GeoJSONSource).setData({
			type: 'FeatureCollection',
			features: Object.values(trek.routes).map((r) => ({
				type: 'Feature',
				properties: { id: r.id, name: r.name },
				geometry: { type: 'LineString', coordinates: r.coordinates.map((c) => [c[0], c[1]]) }
			}))
		});
		(map.getSource('lodging') as GeoJSONSource).setData({
			type: 'FeatureCollection',
			features: trek.lodging.map((p) => ({
				type: 'Feature',
				properties: { id: p.id, name: p.name },
				geometry: { type: 'Point', coordinates: p.coordinates }
			}))
		});
	});

	// Route selection: filters, gaps, "places not on this route" and stop markers.
	$effect(() => {
		if (!dataReady || !map) return;
		const m = map;
		const route = trek.route;
		const selected = route?.id ?? '';
		m.setFilter('routes-bg', ['!=', ['get', 'id'], selected]);
		m.setFilter('route-core', ['==', ['get', 'id'], selected]);
		m.setPaintProperty('routes-bg', 'line-opacity', route ? 0.4 : 0.9);

		const stops = new Set(route?.marks.filter((mk) => mk.kind === 'stop').map((mk) => mk.place));
		(m.getSource('places') as GeoJSONSource).setData({
			type: 'FeatureCollection',
			features: trek.places.map((p) => ({
				type: 'Feature',
				properties: { id: p.id, name: p.name, onRoute: stops.has(p.id) },
				geometry: { type: 'Point', coordinates: p.coordinates }
			}))
		});

		const track = trek.track;
		(m.getSource('gaps') as GeoJSONSource).setData({
			type: 'FeatureCollection',
			features: (route?.gaps ?? []).map(([a, b]) => ({
				type: 'Feature',
				properties: {},
				geometry: { type: 'LineString', coordinates: track!.coordinatesBetween(a, b) }
			}))
		});
	});

	// HTML markers: stops on the selected route plus the place being inspected.
	$effect(() => {
		if (!dataReady || !map || !maplibre) return;
		const m = map;
		const ml = maplibre;
		const ids = new Set(trek.route?.marks.filter((mk) => mk.kind === 'stop').map((mk) => mk.place));
		if (trek.activePlace) ids.add(trek.activePlace);

		markers.forEach((mk) => mk.remove());
		markers = [];
		for (const id of ids) {
			const place = trek.placeById.get(id);
			if (!place) continue;
			const el = document.createElement('div');
			const comp = mount(WaypointMarker, {
				target: el,
				props: {
					place,
					get active() {
						return trek.activePlace === id;
					},
					onselect: (pid: string) => trek.focusPlace(pid)
				}
			});
			const marker = new ml.Marker({ element: el, anchor: 'bottom' }).setLngLat(place.coordinates).addTo(m);
			markers.push({
				remove: () => {
					marker.remove();
					void unmount(comp);
				}
			});
		}
	});

	// Lodging layer visibility.
	$effect(() => {
		if (!dataReady || !map) return;
		const v = trek.showLodging ? 'visible' : 'none';
		for (const l of ['lodging-cluster', 'lodging-count', 'lodging-point']) map.setLayoutProperty(l, 'visibility', v);
	});

	// Camera commands from the UI.
	$effect(() => {
		const cmd = trek.command;
		if (!dataReady || !map || !cmd) return;
		const m = map;
		stopFly();
		stopOrbit();
		const route = untrack(() => trek.route);
		const track = untrack(() => trek.track);

		if (cmd.kind === 'place') {
			const place = untrack(() => trek.placeById.get(cmd.id));
			if (place) flyToPlace(place);
		} else if (cmd.kind === 'day' && route && track) {
			const day = route.days.find((d) => d.day === cmd.day);
			if (!day) return;
			const coords = track.coordinatesBetween(day.startKm, day.endKm);
			m.fitBounds(boundsOf(coords), {
				padding: PADDING,
				pitch: 62,
				bearing: bearingTo(coords[0], coords[coords.length - 1]),
				maxZoom: 14.5,
				duration: duration(3000),
				essential: true
			});
			m.once('moveend', () => trek.activeDay !== null && startOrbit());
		} else if (cmd.kind === 'route' && route) {
			const [w, s, e, n] = route.bbox;
			m.fitBounds([[w, s], [e, n]], {
				padding: PADDING,
				pitch: 58,
				bearing: -20,
				maxZoom: 13,
				duration: duration(3500),
				essential: true
			});
		} else {
			m.flyTo({ ...HOME, duration: duration(3500), essential: true });
		}
	});

	// Stage (day) highlight.
	$effect(() => {
		if (!dataReady) return;
		const day = trek.route?.days.find((d) => d.day === trek.activeDay);
		const track = trek.track;
		setLine('stage', day && track ? track.coordinatesBetween(day.startKm, day.endKm) : []);
	});

	// Progress trail + scrub marker follow scrubKm.
	$effect(() => {
		if (!dataReady || !map || !scrubMarker) return;
		const km = trek.scrubKm;
		const track = trek.track;
		if (km === null || !track) {
			scrubMarker.remove();
			scrubShown = false;
			setLine('progress', []);
			return;
		}
		const p = track.pointAt(km);
		scrubMarker.setLngLat([p.lng, p.lat]);
		if (!scrubShown) {
			scrubMarker.addTo(map);
			scrubShown = true;
		}
		setLine('progress', track.coordinatesUpTo(km));
	});

	// Cinematic fly-through along the selected route.
	$effect(() => {
		if (!dataReady || !map) return;
		const track = trek.track;
		if (!trek.playing || !track) {
			stopFly();
			return;
		}
		const m = map;
		stopOrbit();
		m.stop();

		const total = track.total;
		const resumeKm = untrack(() => trek.scrubKm);
		let km = resumeKm !== null && resumeKm < total - 0.05 ? resumeKm : 0;
		let bearing = m.getBearing();
		let last = performance.now();
		// About 0.7 s per km, bounded so short and long routes both feel right.
		const speed = total / Math.min(90, Math.max(30, total * 0.7));

		const tick = (now: number) => {
			const dt = Math.min(0.5, (now - last) / 1000);
			last = now;
			km = Math.min(total, km + speed * dt);
			const p = track.pointAt(km);
			const ahead = track.pointAt(km + 2.5);
			const t = km / total;
			// Chase the trail heading, smoothed so corners don't whip the camera.
			bearing += shortestAngle(bearing, ahead.bearing) * (1 - Math.exp(-dt * 1.4));
			m.jumpTo({
				center: [p.lng, p.lat],
				bearing,
				pitch: 62 + 10 * Math.sin(Math.PI * t),
				zoom: 13.2 + 1.2 * t
			});
			trek.setScrub(km);
			if (km >= total) {
				trek.playing = false;
				return;
			}
			flyFrame = requestAnimationFrame(tick);
		};
		flyFrame = requestAnimationFrame(tick);
		return stopFly;
	});
</script>

<!-- MapLibre's CSS forces position:relative on its container, so size it via a wrapper. -->
<div class="absolute inset-0">
	<div
		bind:this={container}
		class="size-full"
		role="application"
		aria-label="3D terrain map of Mount Kilimanjaro"
	></div>
</div>

{#if !dataReady}
	<div class="absolute inset-0 grid place-items-center bg-paper-2">
		<p class="display text-lg text-ink-soft italic">
			{trek.status === 'error' ? `Could not load route data: ${trek.error}` : 'Loading terrain…'}
		</p>
	</div>
{/if}

<style>
	:global(.scrub-dot) {
		width: 16px;
		height: 16px;
		border-radius: 9999px;
		background: #c4571f;
		border: 3px solid #f4eee2;
		box-shadow: 0 1px 6px rgb(0 0 0 / 0.5);
		pointer-events: none;
	}
</style>
