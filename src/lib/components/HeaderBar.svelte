<script lang="ts">
	import { Compass } from 'lucide-svelte';
	import { MARANGU_STATS } from '#lib/data/maranguRoute.ts';
	import { trek } from '#lib/state/trek.svelte.ts';
	import StatsHud from './StatsHud.svelte';
</script>

<header
	class="glass pointer-events-auto flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-2xl px-4 py-3"
>
	<div class="flex items-center gap-3">
		<button
			type="button"
			class="grid size-9 place-items-center rounded-xl border border-emerald-400/30 bg-emerald-500/10 text-emerald-300 transition hover:bg-emerald-500/20"
			aria-label="Reset camera to overview"
			onclick={() => trek.showOverview()}
		>
			<Compass class="size-5" aria-hidden="true" />
		</button>
		<div class="leading-tight">
			<h1 class="font-mono text-sm font-semibold tracking-[0.18em] text-white">
				KILISPATIAL <span class="text-emerald-400">//</span> 3D EXPEDITION
			</h1>
			<span
				class="mt-1 inline-block rounded-full border border-amber-300/30 bg-amber-300/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-200"
			>
				Marangu Route ({MARANGU_STATS.durationDays} Days / {MARANGU_STATS.totalDistanceKm} km)
			</span>
		</div>
	</div>
	<StatsHud />
</header>

