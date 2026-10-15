<script lang="ts">
	import { t, i18n } from '#lib/i18n/index.svelte.ts';
	import { Toggle } from 'flowbite-svelte';
	import { trek } from '#lib/state/trek.svelte.ts';
	import LanguagePicker from './LanguagePicker.svelte';
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
			{t('sidebar.lodging', { n: trek.lodging.length })}
		</Toggle>
		<div class="mt-2"><LanguagePicker /></div>
		<p class="mt-2">
			{t('sidebar.notNav')}
			<button
				type="button"
				class="underline decoration-rule underline-offset-4 hover:text-ochre"
				onclick={() => (aboutOpen = true)}>{t('sidebar.about')}</button
			>
		</p>
	</div>
</div>

<AboutModal bind:open={aboutOpen} />
