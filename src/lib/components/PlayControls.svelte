<script lang="ts">
	import { Button } from 'flowbite-svelte';
	import { Play, Pause, RotateCcw } from 'lucide-svelte';
	import { TOTAL_KM } from '#lib/data/route.ts';
	import { trek } from '#lib/state/trek.svelte.ts';

	const atEnd = $derived(trek.scrubKm !== null && trek.scrubKm >= TOTAL_KM - 0.05);
</script>

<div class="flex items-center gap-4">
	<Button
		color="dark"
		class="gap-2 rounded-sm bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ochre focus-within:ring-0 dark:bg-ink dark:hover:bg-ochre"
		disabled={!trek.mapReady}
		onclick={() => trek.togglePlay()}
	>
		{#if trek.playing}
			<Pause class="size-4" aria-hidden="true" /> Pause
		{:else if atEnd}
			<RotateCcw class="size-4" aria-hidden="true" /> Replay
		{:else}
			<Play class="size-4" aria-hidden="true" /> {trek.scrubKm ? 'Resume' : 'Walk the route'}
		{/if}
	</Button>

	<div class="hidden items-center gap-3 sm:flex">
		<span class="text-sm text-ink-soft tabular-nums">
			{(trek.scrubKm ?? 0).toFixed(1)} of {TOTAL_KM.toFixed(1)} km
		</span>
		<div class="h-[3px] w-28 bg-rule" role="progressbar" aria-label="Trek progress" aria-valuenow={Math.round(trek.progress * 100)} aria-valuemin={0} aria-valuemax={100}>
			<div class="h-full bg-ochre" style="width: {trek.progress * 100}%"></div>
		</div>
	</div>
</div>
