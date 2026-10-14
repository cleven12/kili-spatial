<script lang="ts">
	import { Route, ChevronRight, X, ArrowUpRight } from 'lucide-svelte';
	import { STAGES } from '#lib/data/route.ts';
	import { trek } from '#lib/state/trek.svelte.ts';

	let open = $state(false);

	function pick(id: number) {
		trek.focusStage(id);
		open = false;
	}
</script>

<button
	type="button"
	class="glass pointer-events-auto flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-white md:hidden"
	aria-expanded={open}
	aria-controls="stage-panel"
	onclick={() => (open = !open)}
>
	<Route class="size-4 text-emerald-400" aria-hidden="true" /> Stages
</button>

<nav
	id="stage-panel"
	aria-label="Trek stages"
	class="glass pointer-events-auto w-full max-w-xs flex-col gap-1 rounded-2xl p-2 md:flex md:w-72 {open
		? 'mt-2 flex'
		: 'hidden'}"
>
	<div class="flex items-center justify-between px-2 pt-1 pb-2">
		<h2 class="text-[11px] font-semibold tracking-[0.2em] text-white/60 uppercase">Stage Navigator</h2>
		<div class="flex items-center gap-1">
			{#if trek.activeStage !== null}
				<button
					type="button"
					class="rounded-md px-2 py-0.5 text-[11px] text-emerald-300 hover:bg-white/10"
					onclick={() => trek.showOverview()}
				>
					Show all
				</button>
			{/if}
			<button
				type="button"
				class="rounded-md p-1 text-white/60 hover:bg-white/10 md:hidden"
				aria-label="Close stage list"
				onclick={() => (open = false)}
			>
				<X class="size-4" aria-hidden="true" />
			</button>
		</div>
	</div>

	{#each STAGES as stage (stage.id)}
		{@const active = trek.activeStage === stage.id}
		<button
			type="button"
			class="group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition {active
				? 'border-emerald-400/50 bg-emerald-500/15'
				: 'border-transparent hover:bg-white/5'}"
			aria-pressed={active}
			onclick={() => pick(stage.id)}
		>
			<span
				class="grid size-8 shrink-0 place-items-center rounded-lg font-mono text-xs font-semibold {active
					? 'bg-emerald-500 text-black'
					: 'bg-white/10 text-white/80'}"
			>
				D{stage.day}
			</span>
			<span class="min-w-0 flex-1">
				<span class="block truncate text-sm font-medium text-white">{stage.title}</span>
				<span class="block text-[11px] text-white/50">
					{stage.distanceKm.toFixed(1)} km · +{stage.gainM.toLocaleString()} m · {stage.to.elevation.toLocaleString()} m
				</span>
			</span>
			<ChevronRight
				class="size-4 shrink-0 text-white/30 transition group-hover:translate-x-0.5 group-hover:text-white/70"
				aria-hidden="true"
			/>
		</button>
	{/each}

	<div class="flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-white/40">
		<span class="grid size-8 shrink-0 place-items-center rounded-lg bg-white/5 font-mono text-xs">D6</span>
		<span class="min-w-0 flex-1">
			<span class="block text-sm font-medium">Descent → Marangu Gate</span>
			<span class="block text-[11px]">Same trail down · not shown on ascent profile</span>
		</span>
		<ArrowUpRight class="size-4 shrink-0 rotate-90 opacity-40" aria-hidden="true" />
	</div>
</nav>
