<script lang="ts">
	import { onMount } from 'svelte';
	import { ExternalLink, Pause, Play, Plane } from 'lucide-svelte';
	import Map3D from '#lib/components/Map3D.svelte';
	import PlaceCard from '#lib/components/PlaceCard.svelte';
	import ElevationChart from '#lib/components/ElevationChart.svelte';
	import LanguagePicker from '#lib/components/LanguagePicker.svelte';
	import { t } from '#lib/i18n/index.svelte.ts';
	import Credit from '#lib/components/Credit.svelte';
	import { startBridge } from '#lib/embed/bridge.ts';
	import { trek } from '#lib/state/trek.svelte.ts';

	/*
	 * Embeddable viewer: <iframe src="/embed?route=machame&day=3">.
	 * Query: route (id | all), day (1-based), drone=1, chart=0|1, days=0 (hide day chips).
	 * See docs/embedding.md for the postMessage API.
	 */
	const params = typeof location === 'undefined' ? new URLSearchParams() : new URLSearchParams(location.search);
	let showChart = $state(params.get('chart') !== '0');
	const showDays = params.get('days') !== '0';
	const numerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

	let bridge: ReturnType<typeof startBridge> | undefined;

	onMount(() => {
		if (window.innerHeight < 520) showChart = false;
		bridge = startBridge();
		void trek.init();
		return () => bridge?.stop();
	});

	// Open the requested day once the map can fly there.
	let dayApplied = false;
	$effect(() => {
		if (dayApplied || !trek.mapReady || !trek.route) return;
		dayApplied = true;
		const day = Number(params.get('day'));
		if (day && trek.route.days.some((d) => d.day === day)) trek.focusDay(day);
	});

	let announced = false;
	$effect(() => {
		if (trek.status !== 'ready' || announced || !bridge) return;
		announced = true;
		bridge.emit({ type: 'ready', routes: trek.index.map((r) => ({ id: r.id, name: r.name, days: r.durationDays })) });
	});
	$effect(() => {
		if (trek.status === 'ready') bridge?.emit({ type: 'route', id: trek.routeId });
	});
	$effect(() => {
		if (trek.status === 'ready') bridge?.emit({ type: 'day', day: trek.activeDay });
	});
	$effect(() => {
		if (trek.status === 'ready') bridge?.emit({ type: 'place', id: trek.activePlace });
	});
	let lastProgress = 0;
	$effect(() => {
		const km = trek.scrubKm;
		const ele = trek.elevation;
		if (trek.status !== 'ready') return;
		const now = performance.now();
		if (km !== null && now - lastProgress < 100) return;
		lastProgress = now;
		bridge?.emit({ type: 'progress', km, elevation: ele });
	});

	const fullUrl = $derived(`${location.origin}/${trek.routeId ? `?route=${trek.routeId}` : ''}`);
</script>

<svelte:head>
	<title>{trek.route ? t('site.routeTitle', { name: trek.route.name }) : t('site.kiliRoutes')} · KiliSpatial</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main class="relative h-dvh overflow-hidden bg-paper-2">
	<Map3D />
	<PlaceCard />
	<div class="absolute top-2 right-14 z-20 max-sm:top-[6.25rem] max-sm:right-auto max-sm:left-2 sm:top-3"><Credit /></div>

	<!-- Title and day chips -->
	<div class="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col gap-2 p-2 sm:p-3">
		<div class="pointer-events-auto flex w-fit max-w-full items-center gap-3 border border-rule bg-paper px-3 py-1.5">
			<p class="display truncate text-base font-semibold">{trek.route ? t('site.routeTitle', { name: trek.route.name }) : t('site.kiliRoutes')}</p>
			{#if trek.route}
				<p class="label hidden whitespace-nowrap tabular-nums sm:block">
					{t('itinerary.daysKm', { days: trek.route.durationDays })} · {Math.round(trek.route.stats.distanceKm)} km
				</p>
			{/if}
		</div>
		{#if showDays && trek.route}
			<ol class="pointer-events-auto flex w-fit max-w-full gap-1 overflow-x-auto" aria-label={t('embed.itineraryDays')}>
				{#each trek.route.days as d (d.day)}
					{@const active = trek.activeDay === d.day}
					<li>
						<button
							type="button"
							class="border px-2.5 py-1 text-sm whitespace-nowrap {active ? 'border-ink bg-ink text-paper' : 'border-rule bg-paper hover:border-ink'}"
							aria-current={active ? 'step' : undefined}
							title="{trek.placeById.get(d.from)?.name} → {trek.placeById.get(d.to)?.name}"
							onclick={() => trek.focusDay(d.day)}
						>
							{t('embed.day', { n: numerals[d.day - 1] ?? d.day })}
						</button>
					</li>
				{/each}
			</ol>
		{/if}
	</div>

	<!-- Controls and profile -->
	<section class="absolute inset-x-0 bottom-0 border-t border-rule bg-paper" aria-label={t('embed.controls')}>
		<div class="flex items-center justify-between gap-2 px-2 py-1.5 sm:px-3">
			<div class="flex items-center gap-1.5">
				<button
					type="button"
					class="flex items-center gap-1.5 bg-ink px-3 py-1.5 text-sm font-medium text-paper hover:bg-ochre disabled:opacity-40"
					disabled={!trek.mapReady || !trek.track}
					onclick={() => trek.togglePlay()}
				>
					{#if trek.playing}<Pause class="size-4" aria-hidden="true" /> {t('play.pause')}{:else}<Play class="size-4" aria-hidden="true" /> {t('play.flyRoute')}{/if}
				</button>
				<button
					type="button"
					class="flex items-center gap-1.5 border px-3 py-1.5 text-sm font-medium {trek.drone ? 'border-ink bg-ink text-paper' : 'border-ink hover:text-ochre'}"
					aria-pressed={trek.drone}
					disabled={!trek.mapReady}
					onclick={() => trek.toggleDrone()}
				>
					<Plane class="size-4" aria-hidden="true" /> <span class="hidden sm:inline">{t('view.drone')}</span>
				</button>
			</div>
			<p class="label hidden tabular-nums sm:block">{trek.elevation.toLocaleString()} m · {trek.oxygen}% {t('readout.oxygen')}</p>
			<div class="flex items-center gap-3 text-sm">
				{#if trek.track}
					<button type="button" class="text-ink-soft hover:text-ochre" aria-expanded={showChart} onclick={() => (showChart = !showChart)}>
						{t('embed.profile')}
					</button>
				{/if}
				<LanguagePicker />
				<a class="flex items-center gap-1 text-ink-soft underline decoration-rule underline-offset-4 hover:text-ochre" href={fullUrl} target="_blank" rel="noopener">
					KiliSpatial <ExternalLink class="size-3.5" aria-hidden="true" />
				</a>
			</div>
		</div>
		{#if showChart && trek.track}
			<div class="h-28 border-t border-rule px-1 sm:h-36"><ElevationChart /></div>
		{/if}
	</section>
</main>
