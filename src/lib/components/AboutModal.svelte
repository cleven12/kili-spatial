<script lang="ts">
	import { Modal } from 'flowbite-svelte';
	import { Download } from 'lucide-svelte';
	import { downloadRouteGeoJson, downloadRouteGpx } from '#lib/export.ts';
	import { t } from '#lib/i18n/index.svelte.ts';
	import { trek } from '#lib/state/trek.svelte.ts';

	let { open = $bindable(false) }: { open: boolean } = $props();

	const credits = $derived([
		{ what: t('about.trails'), who: '© OpenStreetMap contributors (ODbL)' },
		{ what: t('about.imagery'), who: 'Esri, Maxar, Earthstar Geographics' },
		{ what: t('about.terrain'), who: 'Mapzen / AWS Terrain Tiles (Terrarium)' },
		{ what: t('about.engine'), who: 'MapLibre GL JS (BSD-3-Clause)' },
		{ what: t('about.ui'), who: 'Flowbite Svelte (MIT)' },
		{ what: t('about.icons'), who: 'Lucide (ISC)' }
	]);
	const routes = $derived(Object.values(trek.routes));
	const [pre, post] = $derived(t('about.researchersBody', { link: '\u0000' }).split('\u0000'));
</script>

<Modal bind:open size="md" outsideclose class="rounded-sm bg-paper text-ink" bodyClass="bg-paper">
	{#snippet header()}
		<h2 class="display text-xl font-medium text-ink">{t('about.title')}</h2>
	{/snippet}

	<div class="space-y-4 text-[15px] text-ink">
		<p>{t('about.intro')}</p>
		<p class="border-l-[3px] border-ochre bg-paper-2 px-4 py-3">
			<strong class="font-semibold">{t('about.notNavStrong')}</strong>
			{t('about.notNav')}
		</p>
		<dl class="border-t border-rule">
			{#each credits as c (c.what)}
				<div class="flex justify-between gap-4 border-b border-rule py-2 text-sm">
					<dt class="text-ink-soft">{c.what}</dt>
					<dd class="text-right">{c.who}</dd>
				</div>
			{/each}
		</dl>

		{#if routes.length}
			<div>
				<h3 class="display text-base font-medium">{t('about.researchers')}</h3>
				<p class="mt-1 text-sm text-ink-soft">
					{pre}<a class="underline decoration-rule underline-offset-4 hover:text-ochre" href="/data/index.json">/data/index.json</a>{post}
				</p>
				<ul class="mt-2 divide-y divide-rule border-y border-rule text-sm">
					{#each routes as r (r.id)}
						<li class="flex items-center justify-between py-1.5">
							<span>{r.name}</span>
							<span class="flex gap-4">
								<button type="button" class="flex items-center gap-1 underline decoration-rule underline-offset-4 hover:text-ochre" onclick={() => downloadRouteGeoJson(r, trek.placeById)}>
									<Download class="size-3.5" aria-hidden="true" /> GeoJSON
								</button>
								<button type="button" class="flex items-center gap-1 underline decoration-rule underline-offset-4 hover:text-ochre" onclick={() => downloadRouteGpx(r, trek.placeById)}>
									<Download class="size-3.5" aria-hidden="true" /> GPX
								</button>
							</span>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
		<p class="text-xs text-ink-soft">{t('about.translation')}</p>
	</div>
</Modal>
