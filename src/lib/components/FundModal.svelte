<script lang="ts">
	import { Modal } from 'flowbite-svelte';
	import { Mail } from 'lucide-svelte';
	import { SUPPORT_EMAIL } from '#lib/config.ts';
	import { t } from '#lib/i18n/index.svelte.ts';

	let { open = $bindable(false) }: { open: boolean } = $props();

	const mailto = $derived(
		`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(t('fund.mailSubject'))}&body=${encodeURIComponent(t('fund.mailBody'))}`
	);
</script>

<Modal bind:open size="sm" outsideclose class="rounded-sm bg-paper text-ink" bodyClass="bg-paper">
	{#snippet header()}
		<h2 class="display text-xl font-medium text-ink">{t('fund.title')}</h2>
	{/snippet}
	<div class="space-y-4 text-[15px] text-ink">
		<p>{t('fund.body')}</p>
		{#if SUPPORT_EMAIL}
			<a class="inline-flex items-center gap-2 bg-ink px-3 py-2 text-sm font-medium text-paper hover:bg-ochre" href={mailto}>
				<Mail class="size-4" aria-hidden="true" /> {t('fund.email')}
			</a>
		{:else}
			<p class="border-l-[3px] border-ochre bg-paper-2 px-3 py-2 text-sm">{t('fund.soon')}</p>
		{/if}
	</div>
</Modal>
