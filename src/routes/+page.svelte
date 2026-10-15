<script lang="ts">
	import { onMount } from 'svelte';
	import { Drawer } from 'flowbite-svelte';
	import { ChevronDown, ChevronUp, Eye, ListOrdered } from 'lucide-svelte';
	import Map3D from '#lib/components/Map3D.svelte';
	import Sidebar from '#lib/components/Sidebar.svelte';
	import ElevationChart from '#lib/components/ElevationChart.svelte';
	import PlayControls from '#lib/components/PlayControls.svelte';
	import PlaceCard from '#lib/components/PlaceCard.svelte';
	import GpsPanel from '#lib/components/GpsPanel.svelte';
	import Toolbar from '#lib/components/Toolbar.svelte';
	import FundModal from '#lib/components/FundModal.svelte';
	import Credit from '#lib/components/Credit.svelte';
	import Readout from '#lib/components/Readout.svelte';
	import { t, i18n } from '#lib/i18n/index.svelte.ts';
	import { trek } from '#lib/state/trek.svelte.ts';
	import { ui } from '#lib/state/ui.svelte.ts';

	onMount(() => {
		void trek.init();
	});

	let chartOpen = $state(true);
	let drawerOpen = $state(false);
	let hint = $state(false);

	// Canvas-only mode: briefly say how to get the tools back.
	$effect(() => {
		if (!ui.toolsHidden) {
			hint = false;
			return;
		}
		hint = true;
		const id = setTimeout(() => (hint = false), 5000);
		return () => clearTimeout(id);
	});

	function onkeydown(e: KeyboardEvent) {
		const el = e.target as HTMLElement;
		if (el.closest('input, select, textarea, [contenteditable]') || e.ctrlKey || e.metaKey || e.altKey) return;
		if (e.key === 'h' || e.key === 'H') ui.toggleTools();
	}
</script>

<svelte:window {onkeydown} />

<svelte:head>
	<title>{trek.route ? t('site.routeTitle', { name: trek.route.name }) : t('site.kiliRoutes')} · KiliSpatial</title>
	<meta name="description" content={t('site.description')} />
</svelte:head>

<main class="grid h-dvh grid-cols-1 grid-rows-[minmax(0,1fr)] {ui.toolsHidden ? '' : 'md:grid-cols-[22rem_1fr]'}">
	{#if !ui.toolsHidden}
		<aside class="hidden min-h-0 overflow-hidden border-r border-rule bg-paper md:block" aria-label="KiliSpatial">
			<Sidebar />
		</aside>
	{/if}

	<section class="relative min-h-0 overflow-hidden">
		<Map3D />
		<div class="absolute z-20 {ui.toolsHidden ? 'bottom-3 left-3' : 'top-3 left-3 max-md:top-[7.25rem]'}"><Credit /></div>

		{#if !ui.toolsHidden}
			<PlaceCard />

			<!-- Tools, top right -->
			<div class="absolute top-3 right-14 z-10 flex flex-col items-end gap-2 max-md:top-[4.25rem] max-md:right-3">
				<Toolbar />
				<GpsPanel />
			</div>

			<!-- Mobile top bar -->
			<div class="absolute inset-x-0 top-0 flex items-center justify-between border-b border-rule bg-paper px-4 py-2.5 md:hidden">
				<div class="leading-tight">
					<p class="display text-base font-semibold">{trek.route ? t('site.routeTitle', { name: trek.route.name }) : t('site.allRoutes')}</p>
					<p class="label tabular-nums">{i18n.n(trek.elevation)} m · {trek.oxygen}% {t('readout.oxygen')}</p>
				</div>
				<button
					type="button"
					class="flex items-center gap-2 rounded-sm border border-ink px-3 py-1.5 text-sm font-medium"
					onclick={() => (drawerOpen = true)}
				>
					<ListOrdered class="size-4" aria-hidden="true" /> {t('itinerary.button')}
				</button>
			</div>

			<!-- Elevation profile strip -->
			<section class="absolute inset-x-0 bottom-0 border-t border-rule bg-paper" aria-label={t('chart.title')}>
				<div class="flex items-center justify-between gap-3 px-4 py-2.5">
					<PlayControls />
					<div class="hidden min-w-0 md:block"><Readout /></div>
					<button
						type="button"
						class="flex items-center gap-1.5 text-sm text-ink-soft hover:text-ochre"
						aria-expanded={chartOpen}
						onclick={() => (chartOpen = !chartOpen)}
					>
						{t('chart.title')}
						{#if chartOpen && trek.track}
							<ChevronDown class="size-4" aria-hidden="true" />
						{:else}
							<ChevronUp class="size-4" aria-hidden="true" />
						{/if}
					</button>
				</div>
				{#if chartOpen && trek.track}
					<div class="h-36 border-t border-rule px-1 sm:h-44">
						<ElevationChart />
					</div>
				{/if}
			</section>
		{:else}
			<button
				type="button"
				class="absolute top-3 right-14 z-10 flex items-center gap-2 border border-ink/60 bg-paper/80 px-2.5 py-1.5 text-sm opacity-60 transition-opacity hover:opacity-100 focus-visible:opacity-100"
				title={t('view.showTools')}
				onclick={() => ui.toggleTools()}
			>
				<Eye class="size-4" aria-hidden="true" /> <span class="max-sm:sr-only">{t('view.showTools')}</span>
			</button>
			{#if hint}
				<p class="pointer-events-none absolute top-14 right-14 z-10 max-w-64 border border-rule bg-paper px-3 py-2 text-sm shadow-[0_6px_24px_rgb(0_0_0/0.25)]" role="status">
					{t('view.hint')}
				</p>
			{/if}
		{/if}
	</section>
</main>

<Drawer
	bind:open={drawerOpen}
	placement="bottom"
	class="max-h-[88dvh] overflow-y-auto rounded-t-sm bg-paper p-0 text-ink"
>
	<Sidebar onpick={() => (drawerOpen = false)} />
</Drawer>

<FundModal bind:open={ui.fundOpen} />
