<script lang="ts">
	import { Toggle } from 'flowbite-svelte';
	import { trek } from '#lib/state/trek.svelte.ts';
	import AboutModal from './AboutModal.svelte';
	import Masthead from './Masthead.svelte';
	import StageSelector from './StageSelector.svelte';

	let { onpick }: { onpick?: () => void } = $props();
	let aboutOpen = $state(false);
</script>

<div class="flex h-full min-h-0 flex-col">
	<Masthead />
	<StageSelector {onpick} />
	<div class="shrink-0 border-t border-rule px-5 py-3 text-[13px] text-ink-soft">
		<Toggle bind:checked={trek.showLodging} size="small" class="text-ink">
			Show lodging near the gates ({trek.lodging.length})
		</Toggle>
		<p class="mt-2">
			Approximate routes, not for navigation.
			<button
				type="button"
				class="underline decoration-rule underline-offset-4 hover:text-ochre"
				onclick={() => (aboutOpen = true)}>About and sources</button
			>
		</p>
	</div>
</div>

<AboutModal bind:open={aboutOpen} />
