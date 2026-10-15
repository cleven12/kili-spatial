<script lang="ts">
	import { t, i18n } from '#lib/i18n/index.svelte.ts';
	import { KIND_STYLE } from '#lib/kinds.ts';
	import type { Place } from '#lib/types.ts';

	let {
		place,
		active,
		minor = false,
		onselect
	}: { place: Place; active: boolean; /** Label only shows when zoomed in. */ minor?: boolean; onselect: (id: string) => void } = $props();

	const style = $derived(KIND_STYLE[place.kind]);
	const Icon = $derived(style.Icon);
</script>

<!-- A location pin with its name on top: bold, high contrast, and coded by shape and colour. -->
<button
	type="button"
	title={place.name}
	class="group flex cursor-pointer flex-col items-center outline-none"
	aria-label={t('place.show', { name: place.name }) + (place.elevation ? `, ${i18n.n(place.elevation)} m` : '')}
	onclick={(e) => {
		e.stopPropagation();
		onselect(place.id);
	}}
>
	<span
		data-p={active ? 0 : { summit: 1, gate: 2, hut: 3, camp: 3, lodging: 4 }[place.kind]}
		class="pin-label rounded-[3px] border-2 border-ink px-2 py-1 text-[0.8125rem] leading-none font-bold whitespace-nowrap shadow-[0_2px_10px_rgb(0_0_0/0.45)] transition-colors {minor && !active ? 'kili-minor' : ''} {active
			? 'bg-ink text-white'
			: 'bg-[#fffdf7] text-ink group-hover:bg-paper-2'}"
	>
		{place.name}
		{#if place.elevation}
			<span class="ml-1 hidden font-semibold tabular-nums sm:inline {active ? 'text-white/80' : 'text-ink-soft'}">{i18n.n(place.elevation)} m</span>
		{/if}
	</span>
	<span class="relative mt-0.5 block h-[2.75rem] w-[2.25rem] transition-transform group-hover:scale-110 {active ? 'scale-125' : ''}" style="transform-origin: 50% 100%">
		<svg viewBox="0 0 32 40" class="absolute inset-0 size-full drop-shadow-[0_2px_3px_rgb(0_0_0/0.55)]" aria-hidden="true">
			<path
				d="M16 38.5C16 38.5 3 24.5 3 15.5a13 13 0 1 1 26 0c0 9-13 23-13 23Z"
				fill={style.bg}
				stroke="#ffffff"
				stroke-width="2.5"
				stroke-linejoin="round"
			/>
			<path d="M16 38.5C16 38.5 3 24.5 3 15.5a13 13 0 1 1 26 0c0 9-13 23-13 23Z" fill="none" stroke="#1f1b16" stroke-width="1" stroke-opacity="0.7" />
		</svg>
		<span class="absolute top-[0.45rem] left-1/2 -translate-x-1/2" style="color: {style.fg}">
			<Icon class="size-[1.15rem]" strokeWidth={2.4} aria-hidden="true" />
		</span>
	</span>
</button>
