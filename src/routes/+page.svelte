<script lang="ts">
	import { onMount } from 'svelte';
	import { Drawer } from 'flowbite-svelte';
	import { ChevronDown, ChevronUp, ListOrdered } from 'lucide-svelte';
	import Map3D from '#lib/components/Map3D.svelte';
	import Sidebar from '#lib/components/Sidebar.svelte';
	import ElevationChart from '#lib/components/ElevationChart.svelte';
	import PlayControls from '#lib/components/PlayControls.svelte';
	import PlaceCard from '#lib/components/PlaceCard.svelte';
	import Readout from '#lib/components/Readout.svelte';
	import { trek } from '#lib/state/trek.svelte.ts';

	onMount(() => {
		void trek.init();
	});

	let chartOpen = $state(true);
	let drawerOpen = $state(false);
</script>

<svelte:head>
	<title>{trek.route ? `${trek.route.name} Route` : 'Kilimanjaro routes'} · KiliSpatial</title>
	<meta
		name="description"
		content="Open-source 3D terrain viewer for the Kilimanjaro trekking routes: Marangu, Machame, Lemosho, Rongai, Umbwe, Shira and the Northern Circuit."
	/>
</svelte:head>

<main class="grid h-dvh grid-cols-1 grid-rows-[minmax(0,1fr)] md:grid-cols-[22rem_1fr]">
	<aside class="hidden min-h-0 overflow-hidden border-r border-rule bg-paper md:block" aria-label="Route guide">
		<Sidebar />
	</aside>

	<section class="relative min-h-0 overflow-hidden">
		<Map3D />
		<PlaceCard />

		<!-- Mobile top bar -->
		<div class="absolute inset-x-0 top-0 flex items-center justify-between border-b border-rule bg-paper px-4 py-2.5 md:hidden">
			<div class="leading-tight">
				<p class="display text-base font-semibold">{trek.route ? `${trek.route.name} Route` : 'All routes'}</p>
				<p class="label tabular-nums">{trek.elevation.toLocaleString()} m · {trek.oxygen}% oxygen</p>
			</div>
			<button
				type="button"
				class="flex items-center gap-2 rounded-sm border border-ink px-3 py-1.5 text-sm font-medium"
				onclick={() => (drawerOpen = true)}
			>
				<ListOrdered class="size-4" aria-hidden="true" /> Itinerary
			</button>
		</div>

		<!-- Elevation profile strip -->
		<section class="absolute inset-x-0 bottom-0 border-t border-rule bg-paper" aria-label="Elevation profile">
			<div class="flex items-center justify-between gap-3 px-4 py-2.5">
				<PlayControls />
				<div class="hidden min-w-0 md:block"><Readout /></div>
				<button
					type="button"
					class="flex items-center gap-1.5 text-sm text-ink-soft hover:text-ochre"
					aria-expanded={chartOpen}
					onclick={() => (chartOpen = !chartOpen)}
				>
					Elevation profile
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
	</section>
</main>

<Drawer
	bind:open={drawerOpen}
	placement="bottom"
	class="max-h-[88dvh] overflow-y-auto rounded-t-sm bg-paper p-0 text-ink"
>
	<Sidebar onpick={() => (drawerOpen = false)} />
</Drawer>
