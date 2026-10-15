<script lang="ts">
	import { Select } from 'flowbite-svelte';
	import { trek } from '#lib/state/trek.svelte.ts';

	const options = $derived([
		{ value: 'all', name: 'All routes' },
		...trek.index.map((r) => ({ value: r.id, name: `${r.name} · ${r.durationDays} days · ${Math.round(r.distanceKm)} km` }))
	]);

	const facts = $derived(
		trek.route
			? [
					{ k: 'Days', v: String(trek.route.durationDays) },
					{ k: 'Distance', v: `${Math.round(trek.route.stats.distanceKm)} km` },
					{ k: 'Ascent', v: `${trek.route.stats.ascentM.toLocaleString()} m` }
				]
			: [
					{ k: 'Routes', v: String(trek.index.length) },
					{ k: 'Places', v: String(trek.places.length) },
					{ k: 'Summit', v: '5,895 m' }
				]
	);
</script>

<header class="px-5 pt-5 pb-4">
	<p class="label">Mount Kilimanjaro, Tanzania</p>
	<h1 class="display mt-1 text-[2rem] leading-[1.05] font-semibold">
		{trek.route ? `${trek.route.name} Route` : 'All routes'}
	</h1>
	<p class="mt-2 text-sm text-ink-soft">
		{#if trek.route}
			<span class="italic">{trek.route.nickname}</span> · {trek.route.accommodation === 'huts' ? 'Sleeps in huts' : 'Camping'}
		{:else}
			Pick a route to see its itinerary, camps and elevation profile.
		{/if}
	</p>
	{#if trek.route}
		<p class="mt-2 text-sm text-ink">{trek.route.summary}</p>
		{#if trek.route.unverified}
			<p class="mt-2 border-l-[3px] border-ochre bg-paper-2 px-3 py-2 text-[13px]">
				Indicative itinerary. {trek.route.note ?? 'Day split is approximate.'}
			</p>
		{/if}
	{/if}

	<label class="mt-4 block">
		<span class="label">Route</span>
		<Select
			size="sm"
			class="mt-1 rounded-sm border-rule bg-paper text-ink"
			items={options}
			value={trek.routeId ?? 'all'}
			onchange={(e: Event) => {
				const v = (e.target as HTMLSelectElement).value;
				trek.selectRoute(v === 'all' ? null : v);
			}}
		/>
	</label>

	<dl class="mt-4 grid grid-cols-3 border-y border-rule">
		{#each facts as f, i (f.k)}
			<div class="py-2 {i > 0 ? 'border-l border-rule pl-3' : ''}">
				<dt class="label">{f.k}</dt>
				<dd class="display text-lg font-medium tabular-nums">{f.v}</dd>
			</div>
		{/each}
	</dl>
</header>
