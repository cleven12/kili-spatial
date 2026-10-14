<script lang="ts">
	import { Modal } from 'flowbite-svelte';

	let { open = $bindable(false) }: { open: boolean } = $props();

	const credits = [
		{ what: 'Satellite imagery', who: 'Esri, Maxar, Earthstar Geographics' },
		{ what: 'Terrain elevation', who: 'Mapzen / AWS Terrain Tiles (Terrarium)' },
		{ what: '3D engine', who: 'MapLibre GL JS (BSD-3-Clause)' },
		{ what: 'UI components', who: 'Flowbite Svelte (MIT)' },
		{ what: 'Typefaces', who: 'Fraunces and Instrument Sans (SIL OFL)' },
		{ what: 'Icons', who: 'Lucide (ISC)' }
	];
</script>

<Modal bind:open size="md" outsideclose class="rounded-sm bg-paper text-ink" bodyClass="bg-paper">
	{#snippet header()}
		<h2 class="display text-xl font-medium text-ink">About KiliSpatial</h2>
	{/snippet}

	<div class="space-y-4 text-[15px] text-ink">
		<p>
			An open-source (MIT) 3D viewer for the Marangu Route on Mount Kilimanjaro, built with SvelteKit, MapLibre GL
			JS and Flowbite Svelte.
		</p>
		<p class="border-l-[3px] border-ochre bg-paper-2 px-4 py-3">
			<strong class="font-semibold">Not for navigation.</strong> The trail is an approximation, and weather and
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
	</div>
</Modal>
