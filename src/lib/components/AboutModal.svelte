<script lang="ts">
	import { Modal } from 'flowbite-svelte';
	import { Download, Mail } from 'lucide-svelte';
	import { SUPPORT_EMAIL } from '#lib/config.ts';
	import { downloadRouteGeoJson, downloadRouteGpx } from '#lib/export.ts';
	import { trek } from '#lib/state/trek.svelte.ts';

	let { open = $bindable(false) }: { open: boolean } = $props();

	const credits = [
		{ what: 'Trails and places', who: '© OpenStreetMap contributors (ODbL)' },
		{ what: 'Satellite imagery', who: 'Esri, Maxar, Earthstar Geographics' },
		{ what: 'Terrain elevation', who: 'Mapzen / AWS Terrain Tiles (Terrarium)' },
		{ what: '3D engine', who: 'MapLibre GL JS (BSD-3-Clause)' },
		{ what: 'UI components', who: 'Flowbite Svelte (MIT)' },
		{ what: 'Icons', who: 'Lucide (ISC)' }
	];

	const mailto = $derived(
		`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('KiliSpatial: support request')}&body=${encodeURIComponent(
			'Hello,\n\nI would like to support KiliSpatial.\n\nName / organisation:\nHow I use it (traveller, researcher, operator, other):\nWhat I have in mind:\n'
		)}`
	);
	const routes = $derived(Object.values(trek.routes));
</script>

<Modal bind:open size="md" outsideclose class="rounded-sm bg-paper text-ink" bodyClass="bg-paper">
	{#snippet header()}
		<h2 class="display text-xl font-medium text-ink">About KiliSpatial</h2>
	{/snippet}

	<div class="space-y-4 text-[15px] text-ink">
		<p>
			An open-source (MIT) 3D viewer for the Kilimanjaro trekking routes, built with SvelteKit, MapLibre GL
			JS and Flowbite Svelte.
		</p>
		<p class="border-l-[3px] border-ochre bg-paper-2 px-4 py-3">
			<strong class="font-semibold">Not for navigation.</strong> Itineraries are typical operator schedules, trail geometry comes from OpenStreetMap and may have gaps, and weather and
			oxygen are simulated estimates from altitude. Trek with a licensed guide and official maps.
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
				<h3 class="display text-base font-medium">For researchers</h3>
				<p class="mt-1 text-sm text-ink-soft">
					Download a route as GeoJSON or GPX (line, stops and elevation). The full dataset is also at
					<a class="underline decoration-rule underline-offset-4 hover:text-ochre" href="/data/index.json">/data/index.json</a>.
					Licence: ODbL 1.0. Please credit “© OpenStreetMap contributors, KiliSpatial”.
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

		{#if SUPPORT_EMAIL}
			<div>
				<h3 class="display text-base font-medium">Support this project</h3>
				<p class="mt-1 text-sm text-ink-soft">
					KiliSpatial is free and open source. If it helps your travels or research and you would like to support it,
					send a request by email and we will reply with the options.
				</p>
				<a
					class="mt-2 inline-flex items-center gap-2 bg-ink px-3 py-1.5 text-sm font-medium text-paper hover:bg-ochre"
					href={mailto}
				>
					<Mail class="size-4" aria-hidden="true" /> Email a support request
				</a>
			</div>
		{/if}
	</div>
</Modal>
