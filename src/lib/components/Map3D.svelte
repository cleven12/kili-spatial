<script lang="ts">
	import { onMount, mount, unmount, untrack } from 'svelte';
	import { browser } from '$app/env';
	import type {
		GeoJSONSource,
		Map as MapLibreMap,
		Marker,
		StyleSpecification
	} from 'maplibre-gl';
	import { MARANGU_GEOJSON, MARANGU_WAYPOINTS } from '#lib/data/maranguRoute.ts';
	import {
		STAGES,
		TOTAL_KM,
		coordinatesBetween,
		coordinatesUpTo,
		pointAtDistance
	} from '#lib/data/route.ts';
	import { trek } from '#lib/state/trek.svelte.ts';
	import WaypointMarker from './WaypointMarker.svelte';

	const EXAGGERATION = 1.3;
	const HOME = { center: [37.42, -3.12] as [number, number], pitch: 65, bearing: -20, zoom: 11.5 };
	const FLY_SECONDS = 40;
	const ORBIT_DEG_PER_SEC = 5;

	let container: HTMLDivElement;
	let map: MapLibreMap | undefined;
	let maplibre: typeof import('maplibre-gl') | undefined;
	let ready = $state(false);
	let markerCleanups: (() => void)[] = [];
	let scrubMarker: Marker | undefined;
	let scrubShown = false;
	let orbitFrame = 0;
	let flyFrame = 0;

	const prefersReducedMotion = () =>
		browser && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	const routeLine = MARANGU_GEOJSON.features.find((f) => f.geometry.type === 'LineString')!;

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
				attribution: 'Terrain: Mapzen / AWS Terrain Tiles'
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
			{ id: 'bg', type: 'background', paint: { 'background-color': '#090d16' } },
			{
				id: 'imagery',
				type: 'raster',
				source: 'imagery',
				paint: {
					'raster-brightness-max': 0.72,
					'raster-saturation': -0.15,
					'raster-contrast': 0.15
				}
			},
			{
				id: 'hillshade',
				type: 'hillshade',
				source: 'hillshadeSource',
				paint: {
					'hillshade-exaggeration': 0.55,
					'hillshade-shadow-color': '#02050c',
					'hillshade-highlight-color': '#9fb4d6',
					'hillshade-accent-color': '#0b1220'
				}
			}
		],
		sky: {
			'sky-color': '#0a1330',
			'horizon-color': '#27406b',
			'fog-color': '#0d1526',
			'sky-horizon-blend': 0.6,
			'horizon-fog-blend': 0.75,
			'fog-ground-blend': 0.35,
			'atmosphere-blend': 0.8
		}
	};

	const shortestAngle = (from: number, to: number) => ((((to - from) % 360) + 540) % 360) - 180;

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

	function flyToWaypoint(id: string, orbit: boolean) {
		const wp = MARANGU_WAYPOINTS.find((w) => w.id === id);
		if (!map || !wp) return;
		stopOrbit();
		map.flyTo({
			center: wp.coordinates,
			...wp.cameraSettings,
			duration: prefersReducedMotion() ? 0 : 4000,
			curve: 1.5,
			essential: true
		});
		if (orbit) map.once('moveend', () => trek.activeStage !== null && startOrbit());
	}

	function setSourceData(id: string, coords: [number, number][]) {
		const s = map?.getSource(id) as GeoJSONSource | undefined;
		s?.setData({
			type: 'Feature',
			properties: {},
			geometry: { type: 'LineString', coordinates: coords.length > 1 ? coords : [...coords, ...coords] }
		});
	}

	function addRouteLayers(m: MapLibreMap) {
		const empty: GeoJSON.Feature = {
			type: 'Feature',
			properties: {},
			geometry: { type: 'LineString', coordinates: [] }
		};
		m.addSource('route', { type: 'geojson', data: routeLine as GeoJSON.Feature });
		m.addSource('progress', { type: 'geojson', data: empty });
		m.addSource('stage', { type: 'geojson', data: empty });

		const round = { 'line-cap': 'round', 'line-join': 'round' } as const;
		m.addLayer({
			id: 'route-glow',
			type: 'line',
			source: 'route',
			layout: round,
			paint: { 'line-color': '#f59e0b', 'line-width': 16, 'line-blur': 12, 'line-opacity': 0.55 }
		});
		m.addLayer({
			id: 'route-core',
			type: 'line',
			source: 'route',
			layout: round,
			paint: { 'line-color': '#fbbf24', 'line-width': 3.5, 'line-opacity': 0.95 }
		});
		m.addLayer({
			id: 'stage-glow',
			type: 'line',
			source: 'stage',
			layout: round,
			paint: { 'line-color': '#34d399', 'line-width': 18, 'line-blur': 12, 'line-opacity': 0.7 }
		});
		m.addLayer({
			id: 'stage-core',
			type: 'line',
			source: 'stage',
			layout: round,
			paint: { 'line-color': '#6ee7b7', 'line-width': 4.5 }
		});
		m.addLayer({
			id: 'progress-core',
			type: 'line',
			source: 'progress',
			layout: round,
			paint: { 'line-color': '#10b981', 'line-width': 5 }
		});
	}

	function addMarkers(m: MapLibreMap, ml: typeof import('maplibre-gl')) {
		for (const wp of MARANGU_WAYPOINTS) {
			const el = document.createElement('div');
			const comp = mount(WaypointMarker, {
				target: el,
				props: {
					waypoint: wp,
					get active() {
						return trek.activeWaypoint === wp.id;
					},
					onselect: (id: string) => trek.focusWaypoint(id)
				}
			});
			const marker = new ml.Marker({ element: el, anchor: 'bottom' }).setLngLat(wp.coordinates).addTo(m);
			markerCleanups.push(() => {
				marker.remove();
				void unmount(comp);
			});
		}

		const dot = document.createElement('div');
		dot.className = 'scrub-dot';
		scrubMarker = new ml.Marker({ element: dot });
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
				addRouteLayers(m);
				addMarkers(m, maplibre!);
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
			markerCleanups.forEach((fn) => fn());
			markerCleanups = [];
			scrubMarker?.remove();
			map?.remove();
			map = undefined;
			trek.mapReady = false;
		};
	});

	// Camera commands from the UI (waypoint click, stage select, overview).
	$effect(() => {
		const cmd = trek.command;
		if (!ready || !map || !cmd) return;
		stopFly();
		if (cmd.kind === 'waypoint') {
			flyToWaypoint(cmd.id, false);
		} else if (cmd.kind === 'stage') {
			const stage = STAGES.find((s) => s.id === cmd.id);
			if (stage) flyToWaypoint(stage.to.id, true);
		} else {
			stopOrbit();
			map.flyTo({ ...HOME, duration: prefersReducedMotion() ? 0 : 3500, essential: true });
		}
	});

	// Stage highlight.
	$effect(() => {
		if (!ready) return;
		const stage = STAGES.find((s) => s.id === trek.activeStage);
		setSourceData('stage', stage ? coordinatesBetween(stage.startKm, stage.endKm) : []);
	});

	// Progress trail + scrub marker follow scrubKm.
	$effect(() => {
		if (!ready || !map || !scrubMarker) return;
		const km = trek.scrubKm;
		if (km === null) {
			scrubMarker.remove();
			scrubShown = false;
			setSourceData('progress', []);
			return;
		}
		const p = pointAtDistance(km);
		scrubMarker.setLngLat([p.lng, p.lat]);
		if (!scrubShown) {
			scrubMarker.addTo(map);
			scrubShown = true;
		}
		setSourceData('progress', coordinatesUpTo(km));
	});

	// Cinematic fly-through.
	$effect(() => {
		if (!ready || !map) return;
		if (!trek.playing) {
			stopFly();
			return;
		}
		const m = map;
		stopOrbit();
		m.stop();

		const resumeKm = untrack(() => trek.scrubKm);
		let km = resumeKm !== null && resumeKm < TOTAL_KM - 0.05 ? resumeKm : 0;
		let bearing = m.getBearing();
		let last = performance.now();
		const speed = TOTAL_KM / FLY_SECONDS;

		const tick = (now: number) => {
			const dt = Math.min(0.1, (now - last) / 1000);
			last = now;
			km = Math.min(TOTAL_KM, km + speed * dt);
			const p = pointAtDistance(km);
			const ahead = pointAtDistance(km + 2.5);
			const t = km / TOTAL_KM;
			// Chase the trail heading, smoothed so corners don't whip the camera.
			bearing += shortestAngle(bearing, ahead.bearing) * (1 - Math.exp(-dt * 1.4));
			m.jumpTo({
				center: [p.lng, p.lat],
				bearing,
				pitch: 62 + 12 * t,
				zoom: 13 + 1.6 * t
			});
			trek.setScrub(km);
			if (km >= TOTAL_KM) {
				trek.playing = false;
				return;
			}
			flyFrame = requestAnimationFrame(tick);
		};
		flyFrame = requestAnimationFrame(tick);
		return stopFly;
	});
</script>

<div bind:this={container} class="absolute inset-0" role="application" aria-label="3D terrain map of Mount Kilimanjaro"></div>

{#if !ready}
	<div class="absolute inset-0 grid place-items-center bg-[#090d16]">
		<p class="animate-pulse font-mono text-xs tracking-[0.3em] text-emerald-400/80">LOADING TERRAIN…</p>
	</div>
{/if}

<style>
	:global(.scrub-dot) {
		width: 18px;
		height: 18px;
		border-radius: 9999px;
		background: #fbbf24;
		border: 3px solid #fff;
		box-shadow:
			0 0 0 6px rgba(251, 191, 36, 0.25),
			0 0 24px 6px rgba(251, 191, 36, 0.8);
		pointer-events: none;
	}
</style>
