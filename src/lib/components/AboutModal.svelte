<script lang="ts">
	import { Modal, Badge } from 'flowbite-svelte';

	let { open = $bindable(false) }: { open: boolean } = $props();

	const credits = [
		{ what: 'Satellite imagery', who: 'Esri, Maxar, Earthstar Geographics' },
		{ what: 'Terrain elevation', who: 'Mapzen / AWS Terrain Tiles (Terrarium)' },
		{ what: '3D engine', who: 'MapLibre GL JS (BSD-3-Clause)' },
		{ what: 'UI components', who: 'Flowbite Svelte (MIT)' },
		{ what: 'Icons', who: 'Lucide (ISC)' }
	];
</script>

<Modal bind:open size="md" outsideclose>
	{#snippet header()}
		<h2 class="text-lg font-semibold text-white">About KiliSpatial</h2>
	{/snippet}

	<div class="space-y-4 text-sm text-gray-300">
		<Badge color="secondary">MVP · open source · MIT</Badge>
		<p>
			KiliSpatial is an open-source 3D viewer for the Marangu Route on Mount Kilimanjaro, built with SvelteKit,
			MapLibre GL JS and Flowbite Svelte.
		</p>
		<div class="rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-amber-100">
			<strong>Not for navigation.</strong> The trail is an approximation, and weather and oxygen values are simulated
			estimates from altitude. Always trek with a licensed guide and official maps.
		</div>
		<dl class="divide-y divide-white/10 rounded-lg border border-white/10">
			{#each credits as c (c.what)}
				<div class="flex justify-between gap-4 px-3 py-2">
					<dt class="text-gray-400">{c.what}</dt>
					<dd class="text-right text-white">{c.who}</dd>
				</div>
			{/each}
		</dl>
	</div>
</Modal>
