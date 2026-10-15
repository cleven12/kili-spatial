<script lang="ts">
	import { trek } from '#lib/state/trek.svelte.ts';

	let { onpick }: { onpick?: () => void } = $props();

	const numerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

	function placeName(id: string) {
		return trek.placeById.get(id)?.name ?? id;
	}
</script>

<nav aria-label="Itinerary" class="flex min-h-0 flex-1 flex-col">
	{#if trek.route}
		<div class="flex shrink-0 items-baseline justify-between px-5 pb-2">
			<h2 class="display text-lg font-medium">Itinerary</h2>
			<button
				type="button"
				class="text-sm text-ink-soft underline decoration-rule underline-offset-4 hover:text-ochre"
				onclick={() => {
					trek.showRoute();
					onpick?.();
				}}
			>
				{trek.activeDay !== null ? 'Show whole route' : 'Reset view'}
			</button>
		</div>

		<ol class="min-h-0 flex-1 overflow-y-auto border-t border-rule">
			{#each trek.route.days as day (day.day)}
				{@const active = trek.activeDay === day.day}
				<li class="border-b border-rule">
					<button
						type="button"
						class="flex w-full items-baseline gap-4 border-l-[3px] px-5 py-2.5 text-left transition-colors {active
							? 'border-ochre bg-paper-2'
							: 'border-transparent hover:bg-paper-2/60'}"
						aria-current={active ? 'step' : undefined}
						onclick={() => {
							trek.focusDay(day.day);
							onpick?.();
						}}
					>
						<span class="display w-7 shrink-0 text-base text-ink-soft italic">{numerals[day.day - 1]}</span>
						<span class="min-w-0 flex-1">
							<span class="display block text-[15px] leading-snug font-medium">
								{placeName(day.from)} <span class="text-ink-soft">→</span> {placeName(day.to)}
							</span>
							<span class="mt-0.5 block text-[13px] text-ink-soft tabular-nums">
								{day.distanceKm.toFixed(1)} km · +{day.ascentM.toLocaleString()} / −{day.descentM.toLocaleString()} m · to {day.endElevation.toLocaleString()} m
							</span>
						</span>
					</button>
				</li>
			{/each}
		</ol>
	{:else}
		<div class="shrink-0 px-5 pb-2">
			<h2 class="display text-lg font-medium">Routes</h2>
		</div>
		<ul class="min-h-0 flex-1 overflow-y-auto border-t border-rule">
			{#each trek.index as r (r.id)}
				<li class="border-b border-rule">
					<button
						type="button"
						class="flex w-full items-baseline gap-3 border-l-[3px] border-transparent px-5 py-2.5 text-left hover:bg-paper-2/60"
						onclick={() => {
							trek.selectRoute(r.id);
							onpick?.();
						}}
					>
						<span class="min-w-0 flex-1">
							<span class="display block text-[15px] leading-snug font-medium">{r.name}</span>
							<span class="block text-[13px] text-ink-soft">{r.nickname}</span>
						</span>
						<span class="text-right text-[13px] text-ink-soft tabular-nums">
							{r.durationDays} days<br />{Math.round(r.distanceKm)} km
						</span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</nav>
