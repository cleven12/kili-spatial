<script lang="ts">
	import { Tooltip } from 'flowbite-svelte';
	import { trek } from '#lib/state/trek.svelte.ts';
	import { vegetationAt } from '#lib/data/environment.ts';
</script>

<dl class="flex items-baseline gap-x-5 gap-y-1" aria-label="Current readout">
	<div id="r-alt" class="flex items-baseline gap-1.5">
		<dd class="display text-2xl leading-none font-medium tabular-nums">
			{trek.elevation.toLocaleString()}<span class="ml-0.5 font-sans text-sm font-normal text-ink-soft">m</span>
		</dd>
		<dt class="label hidden lg:block">{trek.scrubKm !== null ? `at ${trek.scrubKm.toFixed(1)} km` : 'under the camera'}</dt>
	</div>
	<div id="r-o2" class="hidden text-sm sm:block">
		<dd class="inline font-medium tabular-nums">{trek.oxygen}%</dd>
		<dt class="label ml-1 inline">oxygen</dt>
	</div>
	<div id="r-temp" class="hidden text-sm xl:block">
		<dd class="inline font-medium tabular-nums">{trek.weather.tempC}°C</dd>
		<dt class="label ml-1 inline">{trek.weather.windKph} km/h wind</dt>
	</div>
	<div class="display hidden text-sm text-ink-soft italic 2xl:block">{vegetationAt(trek.elevation)}</div>
</dl>
<Tooltip triggeredBy="#r-alt">Elevation at the scrubbed point, or under the map centre</Tooltip>
<Tooltip triggeredBy="#r-o2">Share of sea-level oxygen at this altitude (barometric estimate)</Tooltip>
<Tooltip triggeredBy="#r-temp">Simulated from altitude ({trek.weather.label}). Not live weather</Tooltip>
