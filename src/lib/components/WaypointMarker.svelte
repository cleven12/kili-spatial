<script lang="ts">
	import type { Waypoint } from '#lib/data/maranguRoute.ts';

	let {
		waypoint,
		active,
		onselect
	}: { waypoint: Waypoint; active: boolean; onselect: (id: string) => void } = $props();
</script>

<button
	type="button"
	class="group flex cursor-pointer flex-col items-center gap-1 outline-none"
	aria-label="Fly to {waypoint.name}, {waypoint.elevation.toLocaleString()} metres"
	onclick={(e) => {
		e.stopPropagation();
		onselect(waypoint.id);
	}}
>
	<span
		class="rounded-[2px] border px-2 py-1 text-[11px] leading-none whitespace-nowrap shadow-[0_2px_8px_rgb(0_0_0/0.3)] transition-colors {active
			? 'border-ink bg-ink text-paper'
			: 'border-rule bg-paper text-ink group-hover:border-ink'}"
	>
		<span class="font-semibold">{waypoint.name}</span>
		<span class="ml-1 tabular-nums {active ? 'text-paper/70' : 'text-ink-soft'}">{waypoint.elevation.toLocaleString()} m</span>
	</span>
	<span
		class="size-3 rounded-full border-2 border-paper shadow-[0_1px_4px_rgb(0_0_0/0.5)] transition-transform group-hover:scale-125 {active
			? 'scale-125 bg-ink'
			: 'bg-ochre'}"
	></span>
</button>
