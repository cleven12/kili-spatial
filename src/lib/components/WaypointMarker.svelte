<script lang="ts">
	import type { Place } from '#lib/types.ts';

	let {
		place,
		active,
		onselect
	}: { place: Place; active: boolean; onselect: (id: string) => void } = $props();
</script>

<button
	type="button"
	class="group flex cursor-pointer flex-col items-center gap-1 outline-none"
	aria-label="Show {place.name}{place.elevation ? `, ${place.elevation.toLocaleString()} metres` : ''}"
	onclick={(e) => {
		e.stopPropagation();
		onselect(place.id);
	}}
>
	<span
		class="rounded-[2px] border px-2 py-1 text-[11px] leading-none whitespace-nowrap shadow-[0_2px_8px_rgb(0_0_0/0.3)] transition-colors {active
			? 'border-ink bg-ink text-paper'
			: 'border-rule bg-paper text-ink group-hover:border-ink'}"
	>
		<span class="font-semibold">{place.name}</span>
		{#if place.elevation}
			<span class="ml-1 hidden tabular-nums sm:inline {active ? 'text-paper/70' : 'text-ink-soft'}">{place.elevation.toLocaleString()} m</span>
		{/if}
	</span>
	<span
		class="size-3 rounded-full border-2 border-paper shadow-[0_1px_4px_rgb(0_0_0/0.5)] transition-transform group-hover:scale-125 {active
			? 'scale-125 bg-ink'
			: 'bg-ochre'}"
	></span>
</button>
