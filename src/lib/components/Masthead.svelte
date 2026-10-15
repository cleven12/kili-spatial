<script lang="ts">
	import { t, i18n } from '#lib/i18n/index.svelte.ts';
	import { Select } from 'flowbite-svelte';
	import { trek } from '#lib/state/trek.svelte.ts';

	const options = $derived([
		{ value: 'all', name: t('site.allRoutes') },
		...trek.index.map((r) => ({ value: r.id, name: t('masthead.option', { name: r.name, days: r.durationDays, km: Math.round(r.distanceKm) }) }))
	]);

	const facts = $derived(
		trek.route
			? [
					{ k: t('fact.days'), v: String(trek.route.durationDays) },
					{ k: t('fact.distance'), v: `${Math.round(trek.route.stats.distanceKm)} km` },
					{ k: t('fact.ascent'), v: `${i18n.n(trek.route.stats.ascentM)} m` }
				]
			: [
					{ k: t('fact.routes'), v: String(trek.index.length) },
					{ k: t('fact.places'), v: String(trek.places.length) },
					{ k: t('fact.summit'), v: `${i18n.n(5895)} m` }
				]
	);
</script>

<header class="px-5 pt-5 pb-4">
	<p class="label">{t('site.region')}</p>
	<h1 class="display mt-1 text-[2rem] leading-[1.05] font-semibold">
		{trek.route ? t('site.routeTitle', { name: trek.route.name }) : t('site.allRoutes')}
	</h1>
	<p class="mt-2 text-sm text-ink-soft">
		{#if trek.route}
			<span class="italic">{i18n.route(trek.route.id).nickname}</span> · {trek.route.accommodation === 'huts' ? t('masthead.huts') : t('masthead.camping')}
		{:else}
			{t('masthead.pick')}
		{/if}
	</p>
	{#if trek.route}
		<p class="mt-2 text-sm text-ink">{i18n.route(trek.route.id).summary}</p>
		{#if trek.route.unverified}
			<p class="mt-2 border-l-[3px] border-ochre bg-paper-2 px-3 py-2 text-[13px]">
				{t('masthead.indicative')} {i18n.lang === 'en' && trek.route.note ? trek.route.note : t('masthead.daySplit')}
			</p>
		{/if}
	{/if}

	<label class="mt-4 block">
		<span class="label">{t('masthead.route')}</span>
		<Select
			size="sm"
			class="mt-1 rounded-sm border-rule bg-paper text-ink"
			items={options}
			value={trek.routeId ?? 'all'}
			onchange={(e: Event) => {
				const v = (e.target as HTMLSelectElement).value;
				trek.selectRoute(v === 'all' ? null : v);
			}}
		/>
	</label>

	<dl class="mt-4 grid grid-cols-3 border-y border-rule">
		{#each facts as f, i (f.k)}
			<div class="py-2 {i > 0 ? 'border-l border-rule pl-3' : ''}">
				<dt class="label">{f.k}</dt>
				<dd class="display text-lg font-medium tabular-nums">{f.v}</dd>
			</div>
		{/each}
	</dl>
</header>
