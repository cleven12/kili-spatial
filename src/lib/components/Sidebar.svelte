<script lang="ts">
	import AboutModal from './AboutModal.svelte';
	import Masthead from './Masthead.svelte';
	import Readout from './Readout.svelte';
	import StageSelector from './StageSelector.svelte';

	let { onpick }: { onpick?: () => void } = $props();
	let aboutOpen = $state(false);
</script>

<div class="flex h-full flex-col overflow-y-auto">
	<Masthead />
	<StageSelector {onpick} />
	<div class="mt-auto pt-3">
		<Readout />
		<p class="border-t border-rule px-5 py-3 text-[13px] text-ink-soft">
			Approximate route, not for navigation.
			<button
				type="button"
				class="underline decoration-rule underline-offset-4 hover:text-ochre"
				onclick={() => (aboutOpen = true)}>About and sources</button
			>
		</p>
	</div>
</div>

<AboutModal bind:open={aboutOpen} />
