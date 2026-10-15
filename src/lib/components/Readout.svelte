<script lang="ts">
	import { t, i18n } from '#lib/i18n/index.svelte.ts';
	import { Tooltip } from 'flowbite-svelte';
	import { trek } from '#lib/state/trek.svelte.ts';
	import { vegetationAt } from '#lib/data/environment.ts';
</script>

<dl class="flex items-baseline gap-x-5 gap-y-1" aria-label={t('readout.underCamera')}>
	<div id="r-alt" class="flex items-baseline gap-1.5">
		<dd class="display text-2xl leading-none font-medium tabular-nums">
			{i18n.n(trek.elevation)}<span class="ml-0.5 font-sans text-sm font-normal text-ink-soft">m</span>
		</dd>
		<dt class="label hidden lg:block">{trek.scrubKm !== null ? t('readout.atKm', { km: trek.scrubKm.toFixed(1) }) : t('readout.underCamera')}</dt>
	</div>
	<div id="r-o2" class="hidden text-sm sm:block">
		<dd class="inline font-medium tabular-nums">{trek.oxygen}%</dd>
		<dt class="label ml-1 inline">{t('readout.oxygen')}</dt>
	</div>
	<div id="r-temp" class="hidden text-sm xl:block">
		<dd class="inline font-medium tabular-nums">{trek.weather.tempC}°C</dd>
		<dt class="label ml-1 inline">{t('readout.wind', { n: trek.weather.windKph })}</dt>
	</div>
	<div class="display hidden text-sm text-ink-soft italic 2xl:block">{t(vegetationAt(trek.elevation))}</div>
</dl>
<Tooltip triggeredBy="#r-alt">{t('readout.tipAlt')}</Tooltip>
<Tooltip triggeredBy="#r-o2">{t('readout.tipO2')}</Tooltip>
<Tooltip triggeredBy="#r-temp">{t('readout.tipTemp', { label: t(trek.weather.label) })}</Tooltip>
