<script lang="ts">
	import { Button, Tooltip } from 'flowbite-svelte';
	import { ChevronDown, ChevronUp } from 'lucide-svelte';
	import Map3D from '#lib/components/Map3D.svelte';
	import HeaderBar from '#lib/components/HeaderBar.svelte';
	import StageSelector from '#lib/components/StageSelector.svelte';
	import ElevationChart from '#lib/components/ElevationChart.svelte';
	import PlayControls from '#lib/components/PlayControls.svelte';

	let chartOpen = $state(true);
</script>

<svelte:head>
	<title>KiliSpatial — 3D Marangu Route</title>
	<meta
		name="description"
		content="Cinematic 3D terrain viewer for the Marangu Route on Mount Kilimanjaro, from Marangu Gate to Uhuru Peak."
	/>
</svelte:head>

<main class="relative h-dvh w-full overflow-hidden">
	<Map3D />

	<!-- Soft vignette for legibility over bright imagery. -->
	<div
		class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgb(9_13_22/0.65))]"
	></div>

	<div class="pointer-events-none absolute inset-0 flex flex-col gap-3 p-3 sm:p-4">
		<HeaderBar />

		<div class="flex min-h-0 flex-1 flex-col items-start">
			<StageSelector />
		</div>

		<section class="glass pointer-events-auto rounded-2xl p-3" aria-label="Elevation profile">
			<div class="flex items-center justify-between gap-3">
				<PlayControls />
				<div class="flex items-center gap-3">
					<span class="hidden text-[11px] tracking-[0.2em] text-white/50 uppercase sm:inline">
						Ascent profile · distance vs elevation
					</span>
					<Button
						id="chart-toggle"
						color="alternative"
						size="xs"
						class="size-8 border-0 bg-transparent p-0"
						aria-label={chartOpen ? 'Collapse elevation profile' : 'Expand elevation profile'}
						aria-expanded={chartOpen}
						onclick={() => (chartOpen = !chartOpen)}
					>
						{#if chartOpen}
							<ChevronDown class="size-4" aria-hidden="true" />
						{:else}
							<ChevronUp class="size-4" aria-hidden="true" />
						{/if}
					</Button>
					<Tooltip triggeredBy="#chart-toggle">{chartOpen ? 'Collapse' : 'Expand'} profile</Tooltip>
				</div>
			</div>
			{#if chartOpen}
				<div class="mt-2 h-36 sm:h-44">
					<ElevationChart />
				</div>
			{/if}
		</section>
	</div>
</main>
