<script lang="ts">
	import { STAGES } from '#lib/data/route.ts';
	import { trek } from '#lib/state/trek.svelte.ts';

	let { onpick }: { onpick?: () => void } = $props();

	const numerals = ['I', 'II', 'III', 'IV', 'V', 'VI'];

	function pick(id: number) {
		trek.focusStage(id);
		onpick?.();
	}
</script>

<nav aria-label="Itinerary" class="shrink-0">
	<div class="flex items-baseline justify-between px-5 pb-2">
		<h2 class="display text-lg font-medium">Itinerary</h2>
		<button
			type="button"
			class="text-sm text-ink-soft underline decoration-rule underline-offset-4 hover:text-ochre"
			onclick={() => {
				trek.showOverview();
				onpick?.();
			}}
		>
			{trek.activeStage !== null ? 'Show whole route' : 'Reset view'}
		</button>
	</div>

	<ol class="border-t border-rule">
		{#each STAGES as stage (stage.id)}
			{@const active = trek.activeStage === stage.id}
			<li class="border-b border-rule">
				<button
					type="button"
					class="flex w-full items-baseline gap-4 border-l-[3px] px-5 py-2.5 text-left transition-colors {active
						? 'border-ochre bg-paper-2'
						: 'border-transparent hover:bg-paper-2/60'}"
					aria-current={active ? 'step' : undefined}
					onclick={() => pick(stage.id)}
				>
					<span class="display w-7 shrink-0 text-base text-ink-soft italic">{numerals[stage.id - 1]}</span>
					<span class="min-w-0 flex-1">
						<span class="display block text-[15px] leading-snug font-medium">
							{stage.from.name} <span class="text-ink-soft">→</span> {stage.to.name}
						</span>
						<span class="mt-0.5 block text-[13px] text-ink-soft tabular-nums">
							{stage.distanceKm.toFixed(1)} km · +{stage.gainM.toLocaleString()} m · to {stage.to.elevation.toLocaleString()} m
						</span>
					</span>
				</button>
			</li>
		{/each}
		<li class="flex items-baseline gap-4 border-b border-rule px-5 py-2.5 pl-[1.4rem] text-ink-soft/70">
			<span class="display w-7 shrink-0 text-base italic">{numerals[5]}</span>
			<span>
				<span class="display block text-[15px] leading-snug">Descent to Marangu Gate</span>
			</span>
		</li>
	</ol>
</nav>
