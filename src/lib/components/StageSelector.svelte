<script lang="ts">
	import { Badge, Button, Drawer } from 'flowbite-svelte';
	import { Route, ChevronRight, ArrowDownRight } from 'lucide-svelte';
	import { STAGES } from '#lib/data/route.ts';
	import { trek } from '#lib/state/trek.svelte.ts';

	let drawerOpen = $state(false);

	function pick(id: number) {
		trek.focusStage(id);
		drawerOpen = false;
	}
</script>

{#snippet stageList()}
	<div class="flex flex-col gap-1">
		{#each STAGES as stage (stage.id)}
			{@const active = trek.activeStage === stage.id}
			<button
				type="button"
				class="group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition {active
					? 'border-primary-400/50 bg-primary-500/15'
					: 'border-transparent hover:bg-white/5'}"
				aria-pressed={active}
				onclick={() => pick(stage.id)}
			>
				<Badge color={active ? 'primary' : 'gray'} class="size-8 shrink-0 justify-center font-mono">
					D{stage.day}
				</Badge>
				<span class="min-w-0 flex-1">
					<span class="block truncate text-sm font-medium text-white">{stage.title}</span>
					<span class="block text-[11px] text-gray-400">
						{stage.distanceKm.toFixed(1)} km · +{stage.gainM.toLocaleString()} m · {stage.to.elevation.toLocaleString()} m
					</span>
				</span>
				<ChevronRight
					class="size-4 shrink-0 text-white/30 transition group-hover:translate-x-0.5 group-hover:text-white/70"
					aria-hidden="true"
				/>
			</button>
		{/each}

		<div class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-gray-500">
			<Badge color="gray" class="size-8 shrink-0 justify-center font-mono opacity-50">D6</Badge>
			<span class="min-w-0 flex-1">
				<span class="block text-sm font-medium">Descent → Marangu Gate</span>
				<span class="block text-[11px]">Same trail down · not on ascent profile</span>
			</span>
			<ArrowDownRight class="size-4 shrink-0 opacity-40" aria-hidden="true" />
		</div>
	</div>
{/snippet}

<!-- Mobile: bottom drawer -->
<Button color="alternative" size="sm" class="glass pointer-events-auto gap-2 md:hidden" onclick={() => (drawerOpen = true)}>
	<Route class="size-4 text-primary-400" aria-hidden="true" /> Stages
</Button>
<Drawer bind:open={drawerOpen} placement="bottom" class="p-3">
	<div class="mb-2 flex items-center justify-between px-1">
		<h2 class="text-xs font-semibold tracking-[0.2em] text-gray-400 uppercase">Stage Navigator</h2>
	</div>
	{@render stageList()}
</Drawer>

<!-- Desktop: floating panel -->
<nav aria-label="Trek stages" class="glass pointer-events-auto hidden w-72 flex-col gap-1 rounded-2xl p-2 md:flex">
	<div class="flex items-center justify-between px-2 pt-1 pb-2">
		<h2 class="text-[11px] font-semibold tracking-[0.2em] text-gray-400 uppercase">Stage Navigator</h2>
		{#if trek.activeStage !== null}
			<Button color="alternative" size="xs" class="border-0 bg-transparent px-2 py-0.5 text-primary-300" onclick={() => trek.showOverview()}>
				Show all
			</Button>
		{/if}
	</div>
	{@render stageList()}
</nav>
