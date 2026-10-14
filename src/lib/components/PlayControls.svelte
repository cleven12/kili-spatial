<script lang="ts">
	import { Button, Progressbar, Tooltip } from 'flowbite-svelte';
	import { Play, Pause, RotateCcw } from 'lucide-svelte';
	import { TOTAL_KM } from '#lib/data/route.ts';
	import { trek } from '#lib/state/trek.svelte.ts';

	const atEnd = $derived(trek.scrubKm !== null && trek.scrubKm >= TOTAL_KM - 0.05);
</script>

<div class="flex items-center gap-3">
	<Button
		id="play-btn"
		pill
		color="primary"
		class="gap-2 shadow-[0_0_24px_rgba(16,185,129,0.45)]"
		disabled={!trek.mapReady}
		onclick={() => trek.togglePlay()}
	>
		{#if trek.playing}
			<Pause class="size-4" aria-hidden="true" /> Pause
		{:else if atEnd}
			<RotateCcw class="size-4" aria-hidden="true" /> Replay trek
		{:else}
			<Play class="size-4" aria-hidden="true" /> {trek.scrubKm ? 'Resume' : 'Play / Trek'}
		{/if}
	</Button>
	<Tooltip triggeredBy="#play-btn">Cinematic fly-through from Marangu Gate to Uhuru Peak</Tooltip>

	<span class="hidden font-mono text-xs text-gray-400 tabular-nums sm:block">
		{(trek.scrubKm ?? 0).toFixed(1)} / {TOTAL_KM.toFixed(1)} km
	</span>
	<Progressbar
		progress={trek.progress * 100}
		animate={false}
		tweenDuration={0}
		size="h-1.5"
		color="primary"
		class="hidden w-28 sm:block"
		aria-label="Trek progress"
	/>
</div>
