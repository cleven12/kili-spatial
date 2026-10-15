<script lang="ts">
	import { t, i18n } from '#lib/i18n/index.svelte.ts';
	import { X } from 'lucide-svelte';
	import { trek } from '#lib/state/trek.svelte.ts';

	
	const place = $derived(trek.activePlace ? trek.placeById.get(trek.activePlace) : undefined);
</script>

{#if place}
	<section
		aria-label={t('place.details')}
		class="absolute top-3 left-3 z-10 max-h-[60%] w-[min(20rem,calc(100%-5rem))] overflow-y-auto border border-rule bg-paper px-4 py-3 shadow-[0_6px_24px_rgb(0_0_0/0.25)] max-md:top-[4.25rem]"
	>
		<div class="flex items-start justify-between gap-3">
			<div>
				<p class="label">{t(`place.${place.kind}`)}{place.subtype ? ` · ${place.subtype.replace('_', ' ')}` : ''}</p>
				<h3 class="display text-lg leading-tight font-medium">{place.name}</h3>
			</div>
			<button
				type="button"
				class="rounded-sm p-1 text-ink-soft hover:text-ochre"
				aria-label={t('place.close')}
				onclick={() => (trek.activePlace = null)}
			>
				<X class="size-4" aria-hidden="true" />
			</button>
		</div>

		<dl class="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
			{#if place.elevation}
				<div>
					<dt class="label">{t('place.elevation')}</dt>
					<dd class="font-medium tabular-nums">{i18n.n(place.elevation)} m</dd>
				</div>
			{/if}
			{#if place.distanceToGateKm !== undefined}
				<div>
					<dt class="label">{t('place.toGate', { name: trek.placeById.get(place.nearestGate ?? '')?.name ?? t('place.nearestGate') })}</dt>
					<dd class="font-medium tabular-nums">{place.distanceToGateKm} km</dd>
				</div>
			{/if}
			<div class="col-span-2">
				<dt class="label">{t('place.position')}</dt>
				<dd class="tabular-nums">
					{place.coordinates[1].toFixed(4)}, {place.coordinates[0].toFixed(4)}
					<span class="text-ink-soft">
						· {place.approximate ? t('place.approximate') : place.source === 'osm' ? t('place.fromOsm') : t('place.curated')}
					</span>
				</dd>
			</div>
		</dl>

		{#if place.note}
			<p class="mt-2 text-sm">{place.note}</p>
		{/if}

		{#if place.routes?.length}
			<p class="mt-2 text-sm">
				<span class="label">{t('place.onRoutes')}</span><br />
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
					rel="noopener noreferrer nofollow">{t('place.website')}</a
				>
			</p>
		{/if}
	</section>
{/if}
