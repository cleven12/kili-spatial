<script lang="ts">
	import { X } from 'lucide-svelte';
	import { trek } from '#lib/state/trek.svelte.ts';

	const kindLabel = { gate: 'Park gate', camp: 'Camp', hut: 'Hut', summit: 'Summit', lodging: 'Lodging' } as const;

	const place = $derived(trek.activePlace ? trek.placeById.get(trek.activePlace) : undefined);
</script>

{#if place}
	<section
		aria-label="Place details"
		class="absolute top-3 left-3 z-10 max-h-[60%] w-[min(20rem,calc(100%-5rem))] overflow-y-auto border border-rule bg-paper px-4 py-3 shadow-[0_6px_24px_rgb(0_0_0/0.25)] max-md:top-[4.25rem]"
	>
		<div class="flex items-start justify-between gap-3">
			<div>
				<p class="label">{kindLabel[place.kind]}{place.subtype ? ` · ${place.subtype.replace('_', ' ')}` : ''}</p>
				<h3 class="display text-lg leading-tight font-medium">{place.name}</h3>
			</div>
			<button
				type="button"
				class="rounded-sm p-1 text-ink-soft hover:text-ochre"
				aria-label="Close details"
				onclick={() => (trek.activePlace = null)}
			>
				<X class="size-4" aria-hidden="true" />
			</button>
		</div>

		<dl class="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
			{#if place.elevation}
				<div>
					<dt class="label">Elevation</dt>
					<dd class="font-medium tabular-nums">{place.elevation.toLocaleString()} m</dd>
				</div>
			{/if}
			{#if place.distanceToGateKm !== undefined}
				<div>
					<dt class="label">To {trek.placeById.get(place.nearestGate ?? '')?.name ?? 'nearest gate'}</dt>
					<dd class="font-medium tabular-nums">{place.distanceToGateKm} km</dd>
				</div>
			{/if}
			<div class="col-span-2">
				<dt class="label">Position</dt>
				<dd class="tabular-nums">
					{place.coordinates[1].toFixed(4)}, {place.coordinates[0].toFixed(4)}
					<span class="text-ink-soft">
						· {place.approximate ? 'approximate' : place.source === 'osm' ? 'from OpenStreetMap' : 'curated'}
					</span>
				</dd>
			</div>
		</dl>

		{#if place.note}
			<p class="mt-2 text-sm">{place.note}</p>
		{/if}

		{#if place.routes?.length}
			<p class="mt-2 text-sm">
				<span class="label">On routes</span><br />
				{#each place.routes as id, i (id)}
					<button
						type="button"
						class="underline decoration-rule underline-offset-4 hover:text-ochre"
						onclick={() => trek.selectRoute(id)}>{trek.routes[id]?.name ?? id}</button
					>{i < place.routes.length - 1 ? ', ' : ''}
				{/each}
			</p>
		{/if}

		{#if place.website}
			<p class="mt-2 text-sm">
				<a
					class="underline decoration-rule underline-offset-4 hover:text-ochre"
					href={place.website}
					target="_blank"
					rel="noopener noreferrer nofollow">Website</a
				>
			</p>
		{/if}
	</section>
{/if}
