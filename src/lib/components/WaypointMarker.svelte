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
	class="group flex -translate-y-1 cursor-pointer flex-col items-center gap-1.5 outline-none"
	aria-label="Fly to {waypoint.name}, {waypoint.elevation.toLocaleString()} metres"
	onclick={(e) => {
		e.stopPropagation();
		onselect(waypoint.id);
	}}
>
	<span
		class="glass rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap text-white/90 transition group-hover:border-emerald-400/60 group-focus-visible:border-emerald-400/60 {active
			? 'border-emerald-400/70! text-emerald-300'
			: ''}"
	>
		{waypoint.name}
		<span class="ml-1 font-mono text-amber-300">{waypoint.elevation.toLocaleString()} m</span>
	</span>
	<span class="relative flex size-3.5 items-center justify-center">
		<span class="pulse-ring absolute inline-flex size-full rounded-full bg-emerald-400/60"></span>
		<span
			class="relative inline-flex size-3 rounded-full border-2 border-white bg-emerald-500 shadow-[0_0_12px_2px_rgba(16,185,129,0.8)] transition group-hover:scale-125 {active
				? 'scale-125 bg-amber-400'
				: ''}"
		></span>
	</span>
</button>

<style>
	.pulse-ring {
		animation: ping 2.4s cubic-bezier(0, 0, 0.2, 1) infinite;
	}
	@keyframes ping {
		75%,
		100% {
			transform: scale(2.4);
			opacity: 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.pulse-ring {
			animation: none;
		}
	}
</style>
