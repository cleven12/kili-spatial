<script lang="ts">
	import { MARANGU_STATS } from '#lib/data/maranguRoute.ts';

	const facts = [
		{ k: 'Start', v: `${MARANGU_STATS.startElevation.toLocaleString()} m` },
		{ k: 'Summit', v: `${MARANGU_STATS.summitElevation.toLocaleString()} m` },
		{ k: 'Total', v: `${MARANGU_STATS.totalDistanceKm} km` }
	];
</script>

<header class="px-5 pt-5 pb-4">
	<p class="label">Mount Kilimanjaro, Tanzania</p>
	<h1 class="display mt-1 text-[2rem] leading-[1.05] font-semibold">Marangu Route</h1>
	<p class="mt-2 text-sm text-ink-soft">
		The “Coca-Cola” route · {MARANGU_STATS.durationDays} days
	</p>
	<dl class="mt-4 grid grid-cols-3 border-y border-rule">
		{#each facts as f, i (f.k)}
			<div class="py-2 {i > 0 ? 'border-l border-rule pl-3' : ''}">
				<dt class="label">{f.k}</dt>
				<dd class="display text-lg font-medium tabular-nums">{f.v}</dd>
			</div>
		{/each}
	</dl>
</header>
