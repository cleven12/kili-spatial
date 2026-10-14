<script lang="ts">
	import { Play, Pause, RotateCcw } from 'lucide-svelte';
	import { TOTAL_KM } from '#lib/data/route.ts';
	import { trek } from '#lib/state/trek.svelte.ts';

	const atEnd = $derived(trek.scrubKm !== null && trek.scrubKm >= TOTAL_KM - 0.05);
</script>

<div class="flex items-center gap-2">
	<button
		type="button"
		class="flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-black shadow-[0_0_24px_rgba(16,185,129,0.45)] transition hover:bg-emerald-400 disabled:opacity-50"
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
	</button>
	<div class="hidden font-mono text-xs text-white/60 tabular-nums sm:block">
		{(trek.scrubKm ?? 0).toFixed(1)} / {TOTAL_KM.toFixed(1)} km
	</div>
	<div class="hidden h-1.5 w-28 overflow-hidden rounded-full bg-white/10 sm:block" aria-hidden="true">
		<div class="h-full rounded-full bg-linear-to-r from-emerald-400 to-amber-300" style="width: {trek.progress * 100}%"></div>
	</div>
</div>
