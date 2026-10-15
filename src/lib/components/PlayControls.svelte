<script lang="ts">
	import { t } from '#lib/i18n/index.svelte.ts';
	import { Button } from 'flowbite-svelte';
	import { Play, Pause, RotateCcw } from 'lucide-svelte';
		import { trek } from '#lib/state/trek.svelte.ts';

	const atEnd = $derived(trek.scrubKm !== null && trek.scrubKm >= trek.totalKm - 0.05);
</script>

<div class="flex items-center gap-4">
	<Button
		color="dark"
		class="gap-2 rounded-sm bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ochre focus-within:ring-0 dark:bg-ink dark:hover:bg-ochre"
		disabled={!trek.mapReady || !trek.track}
		onclick={() => trek.togglePlay()}
	>
		{#if trek.playing}
			<Pause class="size-4" aria-hidden="true" /> {t('play.pause')}
		{:else if atEnd}
			<RotateCcw class="size-4" aria-hidden="true" /> {t('play.replay')}
		{:else}
			<Play class="size-4" aria-hidden="true" /> {trek.scrubKm ? t('play.resume') : trek.track ? t('play.walk') : t('play.select')}
		{/if}
	</Button>

	<div class="hidden items-center gap-3 sm:flex">
		<span class="text-sm text-ink-soft tabular-nums">
			{t('play.ofKm', { a: (trek.scrubKm ?? 0).toFixed(1), b: trek.totalKm.toFixed(1) })}
		</span>
		<div class="h-[3px] w-28 bg-rule" role="progressbar" aria-label={t('play.progress')} aria-valuenow={Math.round(trek.progress * 100)} aria-valuemin={0} aria-valuemax={100}>
			<div class="h-full bg-ochre" style="width: {trek.progress * 100}%"></div>
		</div>
	</div>
</div>
