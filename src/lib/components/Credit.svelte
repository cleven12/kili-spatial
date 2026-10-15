<script lang="ts">
	import { AUTHOR } from '#lib/config.ts';
	import { t } from '#lib/i18n/index.svelte.ts';
</script>

<!-- Author credit, part of the licence terms. Always visible on the map, also in canvas-only and embedded views. -->
<div class="pointer-events-auto flex items-center gap-1 rounded-sm bg-paper/55 px-1.5 py-0.5 text-[11px] text-ink-soft opacity-75 transition-opacity hover:opacity-100 focus-within:opacity-100">
	<span>{t('credit.dev')} <strong class="font-medium">{AUTHOR.name}</strong></span>
	<a
		href={AUTHOR.repo}
		target="_blank"
		rel="noopener"
		class="grid size-4 place-items-center rounded-full hover:text-ochre focus-visible:outline-2"
		title={t('credit.github')}
		aria-label={t('credit.github')}
	>
		<svg viewBox="0 0 16 16" class="size-3.5" fill="currentColor" aria-hidden="true">
			<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
		</svg>
	</a>
</div>
