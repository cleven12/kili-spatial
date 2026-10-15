<script lang="ts">
	import { Languages } from 'lucide-svelte';
	import { i18n, LANGS, t, type Lang } from '#lib/i18n/index.svelte.ts';
</script>

<label class="flex items-center gap-1.5 text-sm">
	<Languages class="size-4 text-ink-soft" aria-hidden="true" />
	<span class="sr-only">{t('lang.label')}</span>
	<select
		class="cursor-pointer border border-rule bg-paper py-1 pr-7 pl-2 text-sm"
		value={i18n.lang}
		onchange={(e) => i18n.set(e.currentTarget.value as Lang)}
	>
		{#each LANGS as l (l.code)}
			<option value={l.code}>{l.name}</option>
		{/each}
	</select>
</label>
